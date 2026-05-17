import type { OrganizationType } from "@prisma/client";

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  COM: "Com",
  SUSPECTED_COM: "Suspected Com",
  ROBLOX: "Roblox",
  NSFW: "NSFW",
};

export const ORGANIZATION_TYPE_ORDER: OrganizationType[] = [
  "COM",
  "SUSPECTED_COM",
  "ROBLOX",
  "NSFW",
];
