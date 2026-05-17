"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auditActorMeta, requireAuth } from "@/lib/authz";
import { EntityType } from "@/lib/audit-log";
import { isNameBlacklisted } from "@/lib/blacklist";
import { allocateCaseNumber } from "@/lib/cases";
import { prisma } from "@/lib/prisma";
import { caseCreateSchema, casePostSchema } from "@/lib/validations";

async function resolvePlayerId(
  tx: Prisma.TransactionClient,
  actor: ReturnType<typeof auditActorMeta>,
  opts: {
    playerId?: string;
    discordId?: string;
    discordUser?: string;
  },
): Promise<string | null> {
  if (opts.playerId) return opts.playerId;
  if (!opts.discordId || !opts.discordUser) return null;

  if (await isNameBlacklisted({ discordUser: opts.discordUser })) {
    return null;
  }

  const existing = await tx.player.findUnique({
    where: { discordId: opts.discordId },
  });
  if (existing) return existing.id;

  const created = await tx.player.create({
    data: {
      discordId: opts.discordId,
      discordUser: opts.discordUser,
    },
  });
  await tx.auditLog.create({
    data: {
      action: "CREATE",
      entityType: EntityType.Player,
      entityId: created.id,
      ...actor,
    },
  });
  return created.id;
}

export async function createCase(formData: FormData) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  const parsed = caseCreateSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    body: formData.get("body"),
    playerId: formData.get("playerId") ?? undefined,
    organizationId: formData.get("organizationId") ?? undefined,
    discordId: formData.get("discordId") ?? undefined,
    discordUser: formData.get("discordUser") ?? undefined,
  });
  if (!parsed.success) return;

  const d = parsed.data;

  if (d.discordUser && (await isNameBlacklisted({ discordUser: d.discordUser }))) {
    redirect("/cases/new?nameBlocked=1");
  }

  const created = await prisma.$transaction(async (tx) => {
    const playerId = await resolvePlayerId(tx, actor, {
      playerId: d.playerId,
      discordId: d.discordId,
      discordUser: d.discordUser,
    });

    if (!playerId && !d.organizationId) {
      throw new Error("missing_link");
    }

    const { seq, caseNumber } = await allocateCaseNumber(tx, d.category);

    const c = await tx.case.create({
      data: {
        caseNumber,
        category: d.category,
        seq,
        title: d.title,
        body: d.body,
        playerId,
        organizationId: d.organizationId ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.Case,
        entityId: c.id,
        ...actor,
      },
    });

    return c;
  }).catch(() => null);

  if (!created) return;

  revalidatePath("/cases");
  revalidatePath("/");
  redirect(`/cases/${created.id}`);
}

export async function createCasePost(formData: FormData) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  const parsed = casePostSchema.safeParse({
    caseId: formData.get("caseId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return;
  const d = parsed.data;

  const post = await prisma.$transaction(async (tx) => {
    const row = await tx.case.findUnique({ where: { id: d.caseId } });
    if (!row) return null;

    const p = await tx.casePost.create({
      data: {
        caseId: d.caseId,
        authorUserId: session.user.id ?? null,
        body: d.body,
      },
    });

    await tx.case.update({
      where: { id: d.caseId },
      data: { updatedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.CasePost,
        entityId: p.id,
        ...actor,
      },
    });

    return p;
  });

  if (!post) return;

  revalidatePath(`/cases/${d.caseId}`);
}
