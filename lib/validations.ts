import { z } from "zod";

export const organizationTypeValues = [
  "MILITIA",
  "CRIME_FAMILY",
  "STREET_GANG",
  "MOTORCYCLE_CLUB",
  "CARTEL",
] as const;

export type OrganizationTypeValue = (typeof organizationTypeValues)[number];

export const organizationUpsertSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  type: z.enum(organizationTypeValues),
  notes: z.string().max(4000).optional().transform((s) => s?.trim() || undefined),
});

export const organizationMemberSchema = z
  .object({
    organizationId: z.string().min(1),
    playerId: z
      .string()
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
    alias: z
      .string()
      .max(200)
      .optional()
      .transform((s) => s?.trim() || undefined),
    role: z.string().max(120).optional().transform((s) => s?.trim() || undefined),
    notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
  })
  .refine((d) => Boolean(d.playerId) || Boolean(d.alias && d.alias.length > 0), {
    message: "Select a player or enter an alias",
    path: ["alias"],
  });

export const organizationRelationSchema = z
  .object({
    organizationId: z.string().min(1),
    peerOrganizationId: z
      .string()
      .optional()
      .transform((s) => (s && s.length > 0 ? s : undefined)),
    externalLabel: z
      .string()
      .max(200)
      .optional()
      .transform((s) => s?.trim() || undefined),
    relationKind: z
      .string()
      .max(120)
      .optional()
      .transform((s) => s?.trim() || undefined),
    notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
  })
  .refine(
    (d) =>
      Boolean(d.peerOrganizationId) ||
      Boolean(d.externalLabel && d.externalLabel.length > 0),
    {
      message: "Select another organization or enter an external label",
      path: ["externalLabel"],
    },
  )
  .refine(
    (d) =>
      !d.peerOrganizationId || d.peerOrganizationId !== d.organizationId,
    {
      message: "Cannot relate an organization to itself",
      path: ["peerOrganizationId"],
    },
  );

export const organizationIntelSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(1).max(200).trim(),
  body: z.string().max(8000).optional().transform((s) => s?.trim() || undefined),
});

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
