"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditActorMeta, requireAdmin } from "@/lib/authz";
import { normalizeBlacklistPhrase } from "@/lib/blacklist";
import { EntityType } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export async function addNameBlacklistPhrase(formData: FormData) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  const raw = String(formData.get("phrase") ?? "").trim();
  const phraseNormalized = normalizeBlacklistPhrase(raw);
  if (!phraseNormalized) redirect("/settings/blacklist?e=empty");
  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.nameBlacklist.create({
        data: { phrase: raw, phraseNormalized },
      });
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entityType: EntityType.NameBlacklist,
          entityId: row.id,
          ...actor,
        },
      });
    });
  } catch {
    redirect("/settings/blacklist?e=dup");
  }
  revalidatePath("/settings/blacklist");
  redirect("/settings/blacklist");
}

export async function deleteNameBlacklistPhrase(id: string) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  await prisma.$transaction(async (tx) => {
    await tx.nameBlacklist.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.NameBlacklist,
        entityId: id,
        ...actor,
      },
    });
  });
  revalidatePath("/settings/blacklist");
}
