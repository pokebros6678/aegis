import { prisma } from "@/lib/prisma";

/** Normalize for storage and matching (trim + lowercase). */
export function normalizeBlacklistPhrase(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * V1: case-insensitive substring match on firstName, lastName, and organization name.
 * Tighten to exact-match later if needed (e.g. extra column or minimum phrase length).
 */
export async function isNameBlacklisted(input: {
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}): Promise<boolean> {
  const rows = await prisma.nameBlacklist.findMany({
    select: { phraseNormalized: true },
  });
  if (rows.length === 0) return false;

  const fields: string[] = [];
  if (input.firstName != null) fields.push(input.firstName.trim().toLowerCase());
  if (input.lastName != null) fields.push(input.lastName.trim().toLowerCase());
  if (input.organizationName != null) {
    fields.push(input.organizationName.trim().toLowerCase());
  }
  if (fields.length === 0) return false;

  for (const { phraseNormalized } of rows) {
    if (!phraseNormalized) continue;
    for (const f of fields) {
      if (f.includes(phraseNormalized)) return true;
    }
  }
  return false;
}
