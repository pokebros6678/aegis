import Link from "next/link";
import type { CaseCategory } from "@prisma/client";
import { PAGE_CASES } from "@/lib/branding";
import {
  CASE_CATEGORY_LABELS,
  CASE_CATEGORY_ORDER,
} from "@/lib/caseLabels";
import { formatPlayerLabel } from "@/lib/playerDisplay";
import { prisma } from "@/lib/prisma";
import { caseCategoryValues } from "@/lib/validations";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const categoryFilter: CaseCategory | undefined = caseCategoryValues.includes(
    cat as (typeof caseCategoryValues)[number],
  )
    ? (cat as CaseCategory)
    : undefined;

  const cases = await prisma.case.findMany({
    where: categoryFilter ? { category: categoryFilter } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      player: { select: { id: true, discordUser: true, discordId: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  const filterHref = (c?: CaseCategory) =>
    c ? `/cases?cat=${c}` : "/cases";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-normal tracking-wide">
            <span className="text-[#6fdc5c]">aegis&gt;</span> {PAGE_CASES}
          </h1>
          <p className="mt-1 text-sm text-[#6fdc5c]/80">
            Compliance &amp; reporting and analytics case files. Filter by category
            or open a case number.
          </p>
        </div>
        <Link
          href="/cases/new"
          className="shrink-0 border border-[#39ff14] px-3 py-1 font-mono text-sm text-[#39ff14] hover:bg-[#39ff14]/10 focus:outline focus:outline-2 focus:outline-[#39ff14]"
        >
          [ NEW_CASE ]
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2 font-mono text-sm">
        <Link
          href={filterHref()}
          className={`border px-2 py-1 ${
            !categoryFilter
              ? "border-[#39ff14] text-[#39ff14]"
              : "border-[#39ff14]/40 text-[#6fdc5c] hover:border-[#39ff14]/70"
          }`}
        >
          [ ALL ]
        </Link>
        {CASE_CATEGORY_ORDER.map((c) => (
          <Link
            key={c}
            href={filterHref(c)}
            className={`border px-2 py-1 ${
              categoryFilter === c
                ? "border-[#39ff14] text-[#39ff14]"
                : "border-[#39ff14]/40 text-[#6fdc5c] hover:border-[#39ff14]/70"
            }`}
          >
            [ {CASE_CATEGORY_LABELS[c].toUpperCase()} ]
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto border border-[#39ff14]/40">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#39ff14]/40 bg-black text-[#6fdc5c]">
              <th className="p-2 font-normal">Case #</th>
              <th className="p-2 font-normal">Category</th>
              <th className="p-2 font-normal">Title</th>
              <th className="p-2 font-normal">User</th>
              <th className="p-2 font-normal">Group</th>
              <th className="p-2 font-normal">Updated</th>
              <th className="p-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-3 text-[#6fdc5c]/70">
                  no cases on file.
                </td>
              </tr>
            ) : (
              cases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                >
                  <td className="p-2 font-mono text-[#39ff14]">{c.caseNumber}</td>
                  <td className="p-2 text-[#6fdc5c]/90">
                    {CASE_CATEGORY_LABELS[c.category]}
                  </td>
                  <td className="p-2">{c.title}</td>
                  <td className="p-2">
                    {c.player ? (
                      <Link
                        href={`/players/${c.player.id}?tab=overview`}
                        className="text-[#39ff14] hover:underline"
                      >
                        {formatPlayerLabel(c.player)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    {c.organization ? (
                      <Link
                        href={`/organizations/${c.organization.id}?tab=overview`}
                        className="text-[#39ff14] hover:underline"
                      >
                        {c.organization.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2 text-[#6fdc5c]/80">
                    {c.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/cases/${c.id}`}
                      className="text-xs text-[#39ff14] hover:underline"
                    >
                      [ OPEN ]
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
