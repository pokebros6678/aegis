import { z } from "zod";

export const playerUpsertSchema = z.object({
  ssn: z.string().min(1).max(64).trim(),
  firstName: z.string().min(1).max(120).trim(),
  lastName: z.string().min(1).max(120).trim(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const vehicleSchema = z.object({
  playerId: z.string().min(1),
  plate: z.string().max(64).optional().transform((s) => s?.trim() || undefined),
  model: z.string().max(120).optional().transform((s) => s?.trim() || undefined),
  color: z.string().max(64).optional().transform((s) => s?.trim() || undefined),
  notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
});

export const affiliationSchema = z.object({
  playerId: z.string().min(1),
  name: z.string().min(1).max(200).trim(),
  role: z.string().max(120).optional().transform((s) => s?.trim() || undefined),
  notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
  relatedPlayerId: z
    .string()
    .optional()
    .transform((s) => (s && s.length > 0 ? s : undefined)),
});

export const employmentSchema = z.object({
  playerId: z.string().min(1),
  employer: z.string().min(1).max(200).trim(),
  title: z.string().max(120).optional().transform((s) => s?.trim() || undefined),
  startDate: z
    .string()
    .optional()
    .transform((s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined)),
  notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
});
