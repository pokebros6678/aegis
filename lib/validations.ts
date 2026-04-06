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

export const organizationIntelUpdateSchema = z.object({
  organizationId: z.string().min(1),
  intelId: z.string().min(1),
  title: z.string().min(1).max(200).trim(),
  body: z.string().max(8000).optional().transform((s) => s?.trim() || undefined),
});

export const organizationLocationSchema = z.object({
  organizationId: z.string().min(1),
  label: z.string().min(1).max(200).trim(),
  address: z.string().max(4000).optional().transform((s) => s?.trim() || undefined),
  kind: z.string().max(120).optional().transform((s) => s?.trim() || undefined),
  acquiredAt: z
    .string()
    .optional()
    .transform((s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined)),
  notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
});

export const organizationLocationUpdateSchema = organizationLocationSchema.extend({
  locationId: z.string().min(1),
});

export const organizationMemberUpdateSchema = organizationMemberSchema.extend({
  memberId: z.string().min(1),
});

export const organizationRelationUpdateSchema = organizationRelationSchema.extend({
  relationId: z.string().min(1),
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

export const vehicleUpdateSchema = vehicleSchema.extend({
  vehicleId: z.string().min(1),
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

export const affiliationUpdateSchema = affiliationSchema.extend({
  affiliationId: z.string().min(1),
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

export const employmentUpdateSchema = employmentSchema.extend({
  employmentId: z.string().min(1),
});

export const playerMovementSchema = z.object({
  playerId: z.string().min(1),
  seenAt: z.string().min(1),
  locationDescription: z.string().min(1).max(500).trim(),
  notes: z.string().max(2000).optional().transform((s) => s?.trim() || undefined),
  source: z.string().max(200).optional().transform((s) => s?.trim() || undefined),
});

export const playerMovementUpdateSchema = playerMovementSchema.extend({
  movementId: z.string().min(1),
});

export const staffRoleValues = ["ADMIN", "MEMBER"] as const;

export const staffUserCreateSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(64)
    .trim()
    .transform((s) => s.toLowerCase())
    .refine((s) => /^[a-z0-9._-]+$/.test(s), {
      message: "Username: letters, numbers, . _ - only",
    }),
  password: z.string().min(8).max(200),
  displayName: z
    .string()
    .max(120)
    .optional()
    .transform((s) => s?.trim() || undefined),
  role: z.enum(staffRoleValues),
});

export const staffUserUpdateSchema = z.object({
  userId: z.string().min(1),
  displayName: z
    .string()
    .max(120)
    .optional()
    .transform((s) => {
      const t = s?.trim();
      return t && t.length > 0 ? t : undefined;
    }),
  role: z.enum(staffRoleValues),
});

export const staffUserPasswordSchema = z
  .object({
    userId: z.string().min(1),
    password: z.string().min(8).max(200),
    passwordConfirm: z.string().min(8).max(200),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });
