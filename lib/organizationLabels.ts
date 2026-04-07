import type { OrganizationType } from "@prisma/client";

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  MILITIA: "Militias",
  CRIME_FAMILY: "Crime families",
  STREET_GANG: "Street gangs",
  MOTORCYCLE_CLUB: "Motorcycle clubs",
  CARTEL: "Cartels",
  LAW_ENFORCEMENT_AGENCY: "Law enforcement agencies",
  FEDERAL_AGENCY: "Federal agencies",
  MILITARY_BRANCH: "Military branches",
};

export const ORGANIZATION_TYPE_ORDER: OrganizationType[] = [
  "MILITIA",
  "CRIME_FAMILY",
  "STREET_GANG",
  "MOTORCYCLE_CLUB",
  "CARTEL",
  "LAW_ENFORCEMENT_AGENCY",
  "FEDERAL_AGENCY",
  "MILITARY_BRANCH",
];
