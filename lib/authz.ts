import type { AuditActorRole } from "@prisma/client";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";

export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.user.role !== "admin") redirect("/");
  return session;
}

export function sessionActorRole(session: Session | null): "ADMIN" | "MEMBER" {
  if (!session?.user) return "MEMBER";
  return session.user.role === "admin" ? "ADMIN" : "MEMBER";
}

/** Fields for Prisma `AuditLog` on each mutation. */
export function auditActorMeta(session: Session): {
  actorRole: AuditActorRole;
  actorUserId: string;
} {
  const id = session.user.id;
  if (!id) throw new Error("Missing session user id");
  return {
    actorRole: sessionActorRole(session),
    actorUserId: id,
  };
}
