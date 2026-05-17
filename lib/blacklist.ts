import { prisma } from "@/lib/prisma";

/** Normalize for storage and matching (trim + lowercase). */
export function normalizeBlacklistPhrase(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Case-insensitive substring match on discord user and organization name.
 */
export async function isNameBlacklisted(input: {
  discordUser?: string;
  organizationName?: string;
}): Promise<boolean> {
  const rows = await prisma.nameBlacklist.findMany({
    select: { phraseNormalized: true },
  });
  if (rows.length === 0) return false;

  const fields: string[] = [];
  if (input.discordUser != null) {
    fields.push(input.discordUser.trim().toLowerCase());
  }
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
