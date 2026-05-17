"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditActorMeta, requireAdmin, requireAuth } from "@/lib/authz";
import { EntityType } from "@/lib/audit-log";
import { isNameBlacklisted } from "@/lib/blacklist";
import { prisma } from "@/lib/prisma";
import {
  affiliationSchema,
  affiliationUpdateSchema,
  playerUpsertSchema,
} from "@/lib/validations";

export async function createPlayer(formData: FormData) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  const parsed = playerUpsertSchema.safeParse({
    discordId: formData.get("discordId"),
    discordUser: formData.get("discordUser"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return;
  }
  const { discordId, discordUser, notes } = parsed.data;
  if (await isNameBlacklisted({ discordUser })) {
    redirect("/players/new?nameBlocked=1");
  }
  try {
    const p = await prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          discordId,
          discordUser,
          notes: notes ?? null,
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
      return created;
    });
    revalidatePath("/");
    redirect(`/players/${p.id}?tab=overview`);
  } catch {
    return;
  }
}

export async function updatePlayer(playerId: string, formData: FormData) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  const parsed = playerUpsertSchema.safeParse({
    discordId: formData.get("discordId"),
    discordUser: formData.get("discordUser"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { discordId, discordUser, notes } = parsed.data;
  if (await isNameBlacklisted({ discordUser })) {
    return {
      error: {
        _form: ["Name blocked by policy"],
      },
    };
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.player.update({
        where: { id: playerId },
        data: {
          discordId,
          discordUser,
          notes: notes ?? null,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: EntityType.Player,
          entityId: playerId,
          ...actor,
        },
      });
    });
    revalidatePath(`/players/${playerId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update failed";
    if (msg.includes("Unique constraint")) {
      return { error: { discordId: ["Discord ID already exists"] } };
    }
    return { error: { _form: [msg] } };
  }
}

export async function deletePlayer(playerId: string) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  await prisma.$transaction(async (tx) => {
    await tx.player.delete({ where: { id: playerId } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.Player,
        entityId: playerId,
        ...actor,
      },
    });
  });
  revalidatePath("/");
  redirect("/");
}

export async function createAffiliation(formData: FormData) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  const parsed = affiliationSchema.safeParse({
    playerId: formData.get("playerId"),
    organizationId: formData.get("organizationId"),
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.$transaction(async (tx) => {
    const a = await tx.affiliation.create({
      data: {
        playerId: d.playerId,
        organizationId: d.organizationId,
        role: d.role ?? null,
        notes: d.notes ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.Affiliation,
        entityId: a.id,
        ...actor,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteAffiliation(id: string, playerId: string) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  await prisma.$transaction(async (tx) => {
    await tx.affiliation.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.Affiliation,
        entityId: id,
        ...actor,
      },
    });
  });
  revalidatePath(`/players/${playerId}`);
}

export async function updateAffiliation(formData: FormData) {
  const session = await requireAuth();
  const actor = auditActorMeta(session);
  const parsed = affiliationUpdateSchema.safeParse({
    playerId: formData.get("playerId"),
    affiliationId: formData.get("affiliationId"),
    organizationId: formData.get("organizationId"),
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.affiliation.findFirst({
    where: { id: d.affiliationId, playerId: d.playerId },
  });
  if (!row) return;
  await prisma.$transaction(async (tx) => {
    await tx.affiliation.update({
      where: { id: d.affiliationId },
      data: {
        organizationId: d.organizationId,
        role: d.role ?? null,
        notes: d.notes ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.Affiliation,
        entityId: d.affiliationId,
        ...actor,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=affiliations`);
}

export type IntelFormState =
  | { ok: true }
  | { error: Record<string, string[] | undefined> }
  | null;

export async function updatePlayerAction(
  _prev: IntelFormState,
  formData: FormData,
): Promise<IntelFormState> {
  const playerId = String(formData.get("playerId") ?? "");
  if (!playerId) return { error: { _form: ["Missing record id"] } };
  const result = await updatePlayer(playerId, formData);
  if ("error" in result && result.error) {
    return { error: result.error as Record<string, string[] | undefined> };
  }
  return { ok: true };
}
