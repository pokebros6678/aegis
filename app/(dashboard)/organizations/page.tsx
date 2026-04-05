import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ORGANIZATION_TYPE_LABELS,
  ORGANIZATION_TYPE_ORDER,
} from "@/lib/organizationLabels";

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";

  const orgs = await prisma.organization.findMany({
    where:
      term.length > 0
        ? { name: { contains: term, mode: "insensitive" } }
        : undefined,
    orderBy: [{ type: "asc" }, { name: "asc" }],
    take: term.length > 0 ? 200 : 500,
  });

  const grouped = ORGANIZATION_TYPE_ORDER.map((type) => ({
    type,
    label: ORGANIZATION_TYPE_LABELS[type],
    items: orgs.filter((o) => o.type === type),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-normal tracking-wide">
            <span className="text-[#6fdc5c]">aegis&gt;</span> organization_index
          </h1>
          <p className="mt-1 text-sm text-[#6fdc5c]/80">
            Records grouped by type. Search filters by organization name.
          </p>
        </div>
        <Link
          href="/organizations/new"
          className="shrink-0 border border-[#39ff14] px-3 py-1 font-mono text-sm text-[#39ff14] hover:bg-[#39ff14]/10 focus:outline focus:outline-2 focus:outline-[#39ff14]"
        >
          [ NEW_ORG ]
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-2 border border-[#39ff14]/50 bg-black p-3"
      >
        <label className="sr-only" htmlFor="org-q">
          Query
        </label>
        <input
          id="org-q"
          name="q"
          defaultValue={term}
          placeholder="Organization name..."
          className="min-w-[200px] flex-1 border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14] placeholder:text-[#3a5c3a] focus:border-[#39ff14]"
          autoComplete="off"
        />
        <button
          type="submit"
          className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
        >
          [ SEARCH ]
        </button>
      </form>

      <div className="space-y-8">
        {grouped.map(({ type, label, items }) => (
          <section key={type} className="space-y-3">
            <h2 className="border-b border-[#39ff14]/40 pb-1 font-mono text-sm text-[#6fdc5c]">
              &gt; {label}{" "}
              <span className="text-[#39ff14]/60">({type})</span>
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-[#6fdc5c]/60">no records in this category.</p>
            ) : (
              <div className="overflow-x-auto border border-[#39ff14]/40">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#39ff14]/40 bg-black text-[#6fdc5c]">
                      <th className="p-2 font-normal">Name</th>
                      <th className="p-2 font-normal">Updated</th>
                      <th className="p-2 font-normal" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                      >
                        <td className="p-2">
                          <Link
                            href={`/organizations/${o.id}?tab=overview`}
                            className="text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            {o.name}
                          </Link>
                        </td>
                        <td className="p-2 font-mono text-xs text-[#6fdc5c]/90">
                          {o.updatedAt.toISOString()}
                        </td>
                        <td className="p-2">
                          <Link
                            href={`/organizations/${o.id}?tab=overview`}
                            className="text-xs text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            [ EDIT ]
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
