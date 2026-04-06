"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EntityType } from "@/lib/audit-log";
import { auditActorMeta, requireAdmin } from "@/lib/authz";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import {
  staffUserCreateSchema,
  staffUserPasswordSchema,
  staffUserUpdateSchema,
} from "@/lib/validations";

export async function createStaffUser(formData: FormData) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  const parsed = staffUserCreateSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    displayName: formData.get("displayName") ?? undefined,
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirect("/settings/users?e=validation");
  }
  const d = parsed.data;
  const passwordHash = await hashPassword(d.password);
  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.staffUser.create({
        data: {
          username: d.username,
          passwordHash,
          role: d.role,
          displayName: d.displayName ?? null,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entityType: EntityType.StaffUser,
          entityId: row.id,
          ...actor,
        },
      });
    });
  } catch {
    redirect("/settings/users?e=dup");
  }
  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function updateStaffUser(formData: FormData) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  const parsed = staffUserUpdateSchema.safeParse({
    userId: formData.get("userId"),
    displayName: formData.get("displayName") ?? undefined,
    role: formData.get("role"),
  });
  if (!parsed.success) redirect("/settings/users?e=validation");
  const d = parsed.data;

  if (d.role === "MEMBER") {
    const adminCount = await prisma.staffUser.count({
      where: { role: "ADMIN", disabled: false },
    });
    const target = await prisma.staffUser.findUnique({
      where: { id: d.userId },
      select: { role: true },
    });
    if (target?.role === "ADMIN" && adminCount <= 1) {
      redirect("/settings/users?e=lastadmin");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.staffUser.update({
      where: { id: d.userId },
      data: {
        displayName: d.displayName ?? null,
        role: d.role,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.StaffUser,
        entityId: d.userId,
        ...actor,
      },
    });
  });
  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function setStaffUserPassword(formData: FormData) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  const parsed = staffUserPasswordSchema.safeParse({
    userId: formData.get("userId"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
  });
  if (!parsed.success) redirect("/settings/users?e=validation");
  const d = parsed.data;
  const passwordHash = await hashPassword(d.password);
  await prisma.$transaction(async (tx) => {
    await tx.staffUser.update({
      where: { id: d.userId },
      data: { passwordHash },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.StaffUser,
        entityId: d.userId,
        ...actor,
      },
    });
  });
  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function toggleStaffUserDisabled(userId: string) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  if (userId === session.user.id) {
    redirect("/settings/users?e=self");
  }
  const row = await prisma.staffUser.findUnique({
    where: { id: userId },
    select: { disabled: true, role: true },
  });
  if (!row) redirect("/settings/users?e=missing");
  const nextDisabled = !row.disabled;
  if (nextDisabled && row.role === "ADMIN") {
    const adminCount = await prisma.staffUser.count({
      where: { role: "ADMIN", disabled: false },
    });
    if (adminCount <= 1) redirect("/settings/users?e=lastadmin");
  }
  await prisma.$transaction(async (tx) => {
    await tx.staffUser.update({
      where: { id: userId },
      data: { disabled: nextDisabled },
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: EntityType.StaffUser,
        entityId: userId,
        ...actor,
      },
    });
  });
  revalidatePath("/settings/users");
}

export async function deleteStaffUser(userId: string) {
  const session = await requireAdmin();
  const actor = auditActorMeta(session);
  if (userId === session.user.id) {
    redirect("/settings/users?e=self");
  }
  const row = await prisma.staffUser.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!row) redirect("/settings/users?e=missing");
  if (row.role === "ADMIN") {
    const adminCount = await prisma.staffUser.count({
      where: { role: "ADMIN" },
    });
    if (adminCount <= 1) redirect("/settings/users?e=lastadmin");
  }
  await prisma.$transaction(async (tx) => {
    await tx.staffUser.delete({ where: { id: userId } });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entityType: EntityType.StaffUser,
        entityId: userId,
        ...actor,
      },
    });
  });
  revalidatePath("/settings/users");
  redirect("/settings/users");
}
