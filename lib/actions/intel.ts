"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function createPlayer(formData: FormData) {
  await requireAuth();
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
  let p;
  try {
    p = await prisma.player.create({
      data: {
        ssn,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth + "T12:00:00.000Z"),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg.includes("Unique constraint")) {
      return;
    }
    return;
  }
  revalidatePath("/");
  redirect(`/players/${p.id}?tab=overview`);
}

export async function updatePlayer(playerId: string, formData: FormData) {
  await requireAuth();
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
  try {
    await prisma.player.update({
      where: { id: playerId },
      data: {
        ssn,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth + "T12:00:00.000Z"),
      },
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
  await requireAuth();
  await prisma.player.delete({ where: { id: playerId } });
  revalidatePath("/");
  redirect("/");
}

export async function createVehicle(formData: FormData) {
  await requireAuth();
  const parsed = vehicleSchema.safeParse({
    playerId: formData.get("playerId"),
    plate: formData.get("plate") ?? undefined,
    model: formData.get("model") ?? undefined,
    color: formData.get("color") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.vehicle.create({
    data: {
      playerId: d.playerId,
      plate: d.plate ?? null,
      model: d.model ?? null,
      color: d.color ?? null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteVehicle(id: string, playerId: string) {
  await requireAuth();
  await prisma.vehicle.delete({ where: { id } });
  revalidatePath(`/players/${playerId}`);
}

export async function updateVehicle(formData: FormData) {
  await requireAuth();
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
  await prisma.vehicle.update({
    where: { id: d.vehicleId },
    data: {
      plate: d.plate ?? null,
      model: d.model ?? null,
      color: d.color ?? null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=vehicles`);
}

export async function createAffiliation(formData: FormData) {
  await requireAuth();
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
  await prisma.affiliation.create({
    data: {
      playerId: d.playerId,
      name: d.name,
      role: d.role ?? null,
      notes: d.notes ?? null,
      relatedPlayerId: d.relatedPlayerId ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteAffiliation(id: string, playerId: string) {
  await requireAuth();
  await prisma.affiliation.delete({ where: { id } });
  revalidatePath(`/players/${playerId}`);
}

export async function updateAffiliation(formData: FormData) {
  await requireAuth();
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
  await prisma.affiliation.update({
    where: { id: d.affiliationId },
    data: {
      name: d.name,
      role: d.role ?? null,
      notes: d.notes ?? null,
      relatedPlayerId: d.relatedPlayerId ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=affiliations`);
}

export async function createEmployment(formData: FormData) {
  await requireAuth();
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
  await prisma.employmentRecord.create({
    data: {
      playerId: d.playerId,
      employer: d.employer,
      title: d.title ?? null,
      startDate: d.startDate ? new Date(d.startDate + "T12:00:00.000Z") : null,
      endDate: d.endDate ? new Date(d.endDate + "T12:00:00.000Z") : null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function deleteEmployment(id: string, playerId: string) {
  await requireAuth();
  await prisma.employmentRecord.delete({ where: { id } });
  revalidatePath(`/players/${playerId}`);
}

export async function updateEmployment(formData: FormData) {
  await requireAuth();
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
  await prisma.employmentRecord.update({
    where: { id: d.employmentId },
    data: {
      employer: d.employer,
      title: d.title ?? null,
      startDate: d.startDate ? new Date(d.startDate + "T12:00:00.000Z") : null,
      endDate: d.endDate ? new Date(d.endDate + "T12:00:00.000Z") : null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=employment`);
}

export async function createPlayerMovement(formData: FormData) {
  await requireAuth();
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
  await prisma.playerMovement.create({
    data: {
      playerId: d.playerId,
      seenAt: seen,
      locationDescription: d.locationDescription,
      notes: d.notes ?? null,
      source: d.source ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
}

export async function updatePlayerMovement(formData: FormData) {
  await requireAuth();
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
  await prisma.playerMovement.update({
    where: { id: d.movementId },
    data: {
      seenAt: seen,
      locationDescription: d.locationDescription,
      notes: d.notes ?? null,
      source: d.source ?? null,
    },
  });
  revalidatePath(`/players/${d.playerId}`);
  redirect(`/players/${d.playerId}?tab=movements`);
}

export async function deletePlayerMovement(id: string, playerId: string) {
  await requireAuth();
  await prisma.playerMovement.delete({ where: { id } });
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