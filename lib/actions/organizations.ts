"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  organizationIntelSchema,
  organizationIntelUpdateSchema,
  organizationLocationSchema,
  organizationLocationUpdateSchema,
  organizationMemberSchema,
  organizationMemberUpdateSchema,
  organizationRelationSchema,
  organizationRelationUpdateSchema,
  organizationUpsertSchema,
} from "@/lib/validations";
import type { OrganizationType } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function createOrganization(formData: FormData) {
  await requireAuth();
  const parsed = organizationUpsertSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const org = await prisma.organization.create({
    data: {
      name: d.name,
      type: d.type as OrganizationType,
      notes: d.notes ?? null,
    },
  });
  revalidatePath("/organizations");
  redirect(`/organizations/${org.id}?tab=overview`);
}

export async function updateOrganization(organizationId: string, formData: FormData) {
  await requireAuth();
  const parsed = organizationUpsertSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      name: d.name,
      type: d.type as OrganizationType,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${organizationId}`);
  revalidatePath("/organizations");
  return { ok: true };
}

export async function deleteOrganization(organizationId: string) {
  await requireAuth();
  await prisma.organization.delete({ where: { id: organizationId } });
  revalidatePath("/organizations");
  redirect("/organizations");
}

export async function createOrganizationMember(formData: FormData) {
  await requireAuth();
  const parsed = organizationMemberSchema.safeParse({
    organizationId: formData.get("organizationId"),
    playerId: formData.get("playerId") ?? undefined,
    alias: formData.get("alias") ?? undefined,
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.organizationMember.create({
    data: {
      organizationId: d.organizationId,
      playerId: d.playerId ?? null,
      alias: d.alias ?? null,
      role: d.role ?? null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
}

export async function deleteOrganizationMember(id: string, organizationId: string) {
  await requireAuth();
  await prisma.organizationMember.delete({ where: { id } });
  revalidatePath(`/organizations/${organizationId}`);
}

export async function updateOrganizationMember(formData: FormData) {
  await requireAuth();
  const parsed = organizationMemberUpdateSchema.safeParse({
    organizationId: formData.get("organizationId"),
    memberId: formData.get("memberId"),
    playerId: formData.get("playerId") ?? undefined,
    alias: formData.get("alias") ?? undefined,
    role: formData.get("role") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.organizationMember.findFirst({
    where: { id: d.memberId, organizationId: d.organizationId },
  });
  if (!row) return;
  await prisma.organizationMember.update({
    where: { id: d.memberId },
    data: {
      playerId: d.playerId ?? null,
      alias: d.alias ?? null,
      role: d.role ?? null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
  redirect(`/organizations/${d.organizationId}?tab=members`);
}

export async function createOrganizationRelation(formData: FormData) {
  await requireAuth();
  const parsed = organizationRelationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    peerOrganizationId: formData.get("peerOrganizationId") ?? undefined,
    externalLabel: formData.get("externalLabel") ?? undefined,
    relationKind: formData.get("relationKind") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.organizationRelation.create({
    data: {
      organizationId: d.organizationId,
      peerOrganizationId: d.peerOrganizationId ?? null,
      externalLabel: d.externalLabel ?? null,
      relationKind: d.relationKind ?? null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
}

export async function deleteOrganizationRelation(id: string, organizationId: string) {
  await requireAuth();
  await prisma.organizationRelation.delete({ where: { id } });
  revalidatePath(`/organizations/${organizationId}`);
}

export async function updateOrganizationRelation(formData: FormData) {
  await requireAuth();
  const parsed = organizationRelationUpdateSchema.safeParse({
    organizationId: formData.get("organizationId"),
    relationId: formData.get("relationId"),
    peerOrganizationId: formData.get("peerOrganizationId") ?? undefined,
    externalLabel: formData.get("externalLabel") ?? undefined,
    relationKind: formData.get("relationKind") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.organizationRelation.findFirst({
    where: { id: d.relationId, organizationId: d.organizationId },
  });
  if (!row) return;
  await prisma.organizationRelation.update({
    where: { id: d.relationId },
    data: {
      peerOrganizationId: d.peerOrganizationId ?? null,
      externalLabel: d.externalLabel ?? null,
      relationKind: d.relationKind ?? null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
  redirect(`/organizations/${d.organizationId}?tab=relations`);
}

export async function createOrganizationIntel(formData: FormData) {
  await requireAuth();
  const parsed = organizationIntelSchema.safeParse({
    organizationId: formData.get("organizationId"),
    title: formData.get("title"),
    body: formData.get("body") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.organizationIntel.create({
    data: {
      organizationId: d.organizationId,
      title: d.title,
      body: d.body ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
}

export async function deleteOrganizationIntel(id: string, organizationId: string) {
  await requireAuth();
  await prisma.organizationIntel.delete({ where: { id } });
  revalidatePath(`/organizations/${organizationId}`);
}

export async function updateOrganizationIntel(formData: FormData) {
  await requireAuth();
  const parsed = organizationIntelUpdateSchema.safeParse({
    organizationId: formData.get("organizationId"),
    intelId: formData.get("intelId"),
    title: formData.get("title"),
    body: formData.get("body") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.organizationIntel.findFirst({
    where: { id: d.intelId, organizationId: d.organizationId },
  });
  if (!row) return;
  await prisma.organizationIntel.update({
    where: { id: d.intelId },
    data: { title: d.title, body: d.body ?? null },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
  redirect(`/organizations/${d.organizationId}?tab=intelligence`);
}

export async function createOrganizationLocation(formData: FormData) {
  await requireAuth();
  const parsed = organizationLocationSchema.safeParse({
    organizationId: formData.get("organizationId"),
    label: formData.get("label"),
    address: formData.get("address") ?? undefined,
    kind: formData.get("kind") ?? undefined,
    acquiredAt: formData.get("acquiredAt") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  await prisma.organizationLocation.create({
    data: {
      organizationId: d.organizationId,
      label: d.label,
      address: d.address ?? null,
      kind: d.kind ?? null,
      acquiredAt: d.acquiredAt
        ? new Date(d.acquiredAt + "T12:00:00.000Z")
        : null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
}

export async function updateOrganizationLocation(formData: FormData) {
  await requireAuth();
  const parsed = organizationLocationUpdateSchema.safeParse({
    organizationId: formData.get("organizationId"),
    locationId: formData.get("locationId"),
    label: formData.get("label"),
    address: formData.get("address") ?? undefined,
    kind: formData.get("kind") ?? undefined,
    acquiredAt: formData.get("acquiredAt") ?? undefined,
    notes: formData.get("notes") ?? undefined,
  });
  if (!parsed.success) return;
  const d = parsed.data;
  const row = await prisma.organizationLocation.findFirst({
    where: { id: d.locationId, organizationId: d.organizationId },
  });
  if (!row) return;
  await prisma.organizationLocation.update({
    where: { id: d.locationId },
    data: {
      label: d.label,
      address: d.address ?? null,
      kind: d.kind ?? null,
      acquiredAt: d.acquiredAt
        ? new Date(d.acquiredAt + "T12:00:00.000Z")
        : null,
      notes: d.notes ?? null,
    },
  });
  revalidatePath(`/organizations/${d.organizationId}`);
  redirect(`/organizations/${d.organizationId}?tab=locations`);
}

export async function deleteOrganizationLocation(id: string, organizationId: string) {
  await requireAuth();
  await prisma.organizationLocation.delete({ where: { id } });
  revalidatePath(`/organizations/${organizationId}`);
}

export type OrgFormState =
  | { ok: true }
  | { error: Record<string, string[] | undefined> }
  | null;

export async function updateOrganizationAction(
  _prev: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const organizationId = String(formData.get("organizationId") ?? "");
  if (!organizationId) return { error: { _form: ["Missing organization id"] } };
  const result = await updateOrganization(organizationId, formData);
  if ("error" in result && result.error) {
    return { error: result.error as Record<string, string[] | undefined> };
  }
  return { ok: true };
}
