"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth, sessionActorRole } from "@/lib/authz";
import { EntityType } from "@/lib/audit-log";
import { isNameBlacklisted } from "@/lib/blacklist";
import { prisma } from "@/lib/prisma";
import {
  affiliationSchema,
  affiliationUpdateSchema,
  employmentSchema,
  employmentUpdateSchema,
  playerMovementSchema,
  playerMovementUpdateSchema,
  playerUpsertSchema,
  vehicleSchema,
  vehicleUpdateSchema,
} from "@/lib/validations";

export async function createPlayer(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = playerUpsertSchema.safeParse({
    ssn: formData.get("ssn"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
  });
  if (!parsed.success) {
    return;
  }
  const { ssn, firstName, lastName, dateOfBirth } = parsed.data;
  if (await isNameBlacklisted({ firstName, lastName })) {
    redirect("/players/new?nameBlocked=1");
  }
  try {
    const p = await prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          ssn,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth + "T12:00:00.000Z"),
        },
      });
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entityType: EntityType.Player,
          entityId: created.id,
          actorRole,
        },
      });
      return created;
    });
    revalidatePath("/");
    redirect(`/players/${p.id}?tab=overview`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg.includes("Unique constraint")) {
      return;
    }
    return;
  }
}

export async function updatePlayer(playerId: string, formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = playerUpsertSchema.safeParse({
    ssn: formData.get("ssn"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const { ssn, firstName, lastName, dateOfBirth } = parsed.data;
  if (await isNameBlacklisted({ firstName, lastName })) {
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
          ssn,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth + "T12:00:00.000Z"),
        },
      });
      await tx.auditLog.create({
        data: {
          action: "UPDATE",
          entityType: EntityType.Player,
          entityId: playerId,
          actorRole,
        },
      });
    });
    revalidatePath(`/players/${playerId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Update failed";
    if (msg.includes("Unique constraint")) {
      return { error: { ssn: ["SSN already exists"] } };
    }
    return { error: { _form: [msg] } };
  }
}

export async function deletePlayer(playerId: string) {
  const session = await requireAdmin();
  const actorRole = sessionActorRole(session);
  await prisma.$transaction(async (tx) => {
    await tx.player.delete({ where: { id: playerId } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.Player,
        entityId: playerId,
        actorRole,
      },
    });
  });
  revalidatePath("/");
  redirect("/");
}

export async function createVehicle(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = vehicleSchema.safeParse({
    playerId: formData.get("playerId"),
    plate: formData.get("plate") ?? undefined,
    model: formData.get("model") ?? undefined,
    color: formData.get("color") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.$transaction(async (tx) => {
    const v = await tx.vehicle.create({
      data: {
        playerId: d.playerId,
        plate: d.plate ?? null,
        model: d.model ?? null,
        color: d.color ?? null,
        notes: d.notes ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.Vehicle,
        entityId: v.id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteVehicle(id: string, playerId: string) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.Vehicle,
        entityId: id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${playerId}`);
}

export async function updateVehicle(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = vehicleUpdateSchema.safeParse({
    playerId: formData.get("playerId"),
    vehicleId: formData.get("vehicleId"),
    plate: formData.get("plate") ?? undefined,
    model: formData.get("model") ?? undefined,
    color: formData.get("color") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.vehicle.findFirst({
    where: { id: d.vehicleId, playerId: d.playerId },
  });
  if (!row) return;
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id: d.vehicleId },
      data: {
        plate: d.plate ?? null,
        model: d.model ?? null,
        color: d.color ?? null,
        notes: d.notes ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.Vehicle,
        entityId: d.vehicleId,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=vehicles`);
}

export async function createAffiliation(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = affiliationSchema.safeParse({
    playerId: formData.get("playerId"),
    name: formData.get("name"),
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    relatedPlayerId: formData.get("relatedPlayerId") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  if (d.relatedPlayerId === d.playerId) return;
  await prisma.$transaction(async (tx) => {
    const a = await tx.affiliation.create({
      data: {
        playerId: d.playerId,
        name: d.name,
        role: d.role ?? null,
        notes: d.notes ?? null,
        relatedPlayerId: d.relatedPlayerId ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.Affiliation,
        entityId: a.id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteAffiliation(id: string, playerId: string) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  await prisma.$transaction(async (tx) => {
    await tx.affiliation.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.Affiliation,
        entityId: id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${playerId}`);
}

export async function updateAffiliation(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = affiliationUpdateSchema.safeParse({
    playerId: formData.get("playerId"),
    affiliationId: formData.get("affiliationId"),
    name: formData.get("name"),
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    relatedPlayerId: formData.get("relatedPlayerId") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  if (d.relatedPlayerId === d.playerId) return;
  const row = await prisma.affiliation.findFirst({
    where: { id: d.affiliationId, playerId: d.playerId },
  });
  if (!row) return;
  await prisma.$transaction(async (tx) => {
    await tx.affiliation.update({
      where: { id: d.affiliationId },
      data: {
        name: d.name,
        role: d.role ?? null,
        notes: d.notes ?? null,
        relatedPlayerId: d.relatedPlayerId ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.Affiliation,
        entityId: d.affiliationId,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=affiliations`);
}

export async function createEmployment(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = employmentSchema.safeParse({
    playerId: formData.get("playerId"),
    employer: formData.get("employer"),
    title: formData.get("title") ?? undefined,
    startDate: formData.get("startDate") ?? undefined,
    endDate: formData.get("endDate") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.$transaction(async (tx) => {
    const e = await tx.employmentRecord.create({
      data: {
        playerId: d.playerId,
        employer: d.employer,
        title: d.title ?? null,
        startDate: d.startDate ? new Date(d.startDate + "T12:00:00.000Z") : null,
        endDate: d.endDate ? new Date(d.endDate + "T12:00:00.000Z") : null,
        notes: d.notes ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.EmploymentRecord,
        entityId: e.id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteEmployment(id: string, playerId: string) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  await prisma.$transaction(async (tx) => {
    await tx.employmentRecord.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.EmploymentRecord,
        entityId: id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${playerId}`);
}

export async function updateEmployment(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = employmentUpdateSchema.safeParse({
    playerId: formData.get("playerId"),
    employmentId: formData.get("employmentId"),
    employer: formData.get("employer"),
    title: formData.get("title") ?? undefined,
    startDate: formData.get("startDate") ?? undefined,
    endDate: formData.get("endDate") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.employmentRecord.findFirst({
    where: { id: d.employmentId, playerId: d.playerId },
  });
  if (!row) return;
  await prisma.$transaction(async (tx) => {
    await tx.employmentRecord.update({
      where: { id: d.employmentId },
      data: {
        employer: d.employer,
        title: d.title ?? null,
        startDate: d.startDate ? new Date(d.startDate + "T12:00:00.000Z") : null,
        endDate: d.endDate ? new Date(d.endDate + "T12:00:00.000Z") : null,
        notes: d.notes ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.EmploymentRecord,
        entityId: d.employmentId,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=employment`);
}

export async function createPlayerMovement(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = playerMovementSchema.safeParse({
    playerId: formData.get("playerId"),
    seenAt: formData.get("seenAt"),
    locationDescription: formData.get("locationDescription"),
    notes: formData.get("notes") ?? undefined,
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const seen = new Date(d.seenAt);
  if (Number.isNaN(seen.getTime())) return;
  await prisma.$transaction(async (tx) => {
    const m = await tx.playerMovement.create({
      data: {
        playerId: d.playerId,
        seenAt: seen,
        locationDescription: d.locationDescription,
        notes: d.notes ?? null,
        source: d.source ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: EntityType.PlayerMovement,
        entityId: m.id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function updatePlayerMovement(formData: FormData) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  const parsed = playerMovementUpdateSchema.safeParse({
    playerId: formData.get("playerId"),
    movementId: formData.get("movementId"),
    seenAt: formData.get("seenAt"),
    locationDescription: formData.get("locationDescription"),
    notes: formData.get("notes") ?? undefined,
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.playerMovement.findFirst({
    where: { id: d.movementId, playerId: d.playerId },
  });
  if (!row) return;
  const seen = new Date(d.seenAt);
  if (Number.isNaN(seen.getTime())) return;
  await prisma.$transaction(async (tx) => {
    await tx.playerMovement.update({
      where: { id: d.movementId },
      data: {
        seenAt: seen,
        locationDescription: d.locationDescription,
        notes: d.notes ?? null,
        source: d.source ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.PlayerMovement,
        entityId: d.movementId,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=movements`);
}

export async function deletePlayerMovement(id: string, playerId: string) {
  const session = await requireAuth();
  const actorRole = sessionActorRole(session);
  await prisma.$transaction(async (tx) => {
    await tx.playerMovement.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.PlayerMovement,
        entityId: id,
        actorRole,
      },
    });
  });
  revalidatePath(`/players/${playerId}`);
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
  if ("error" in result && result.error) return { error: result.error as Record<string, string[] | undefined> };
  return { ok: true };
}
