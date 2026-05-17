import type { CaseCategory } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { formatCaseNumber } from "@/lib/caseLabels";

export async function allocateCaseNumber(
  tx: Prisma.TransactionClient,
  category: CaseCategory,
): Promise<{ seq: number; caseNumber: string }> {
  const agg = await tx.case.aggregate({
    where: { category },
    _max: { seq: true },
  });
  const seq = (agg._max.seq ?? 0) + 1;
  return { seq, caseNumber: formatCaseNumber(category, seq) };
}
