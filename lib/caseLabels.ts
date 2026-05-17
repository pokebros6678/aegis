import type { CaseCategory } from "@prisma/client";

export const CASE_CATEGORY_LABELS: Record<CaseCategory, string> = {
  COMPLIANCE_REPORTING: "Compliance & Reporting",
  ANALYTICS: "Analytics",
};

export const CASE_CATEGORY_ORDER: CaseCategory[] = [
  "COMPLIANCE_REPORTING",
  "ANALYTICS",
];

export const CASE_CATEGORY_PREFIX: Record<CaseCategory, string> = {
  COMPLIANCE_REPORTING: "CR",
  ANALYTICS: "A",
};

export function formatCaseNumber(category: CaseCategory, seq: number): string {
  const prefix = CASE_CATEGORY_PREFIX[category];
  return `${prefix}${seq.toString().padStart(4, "0")}`;
}
