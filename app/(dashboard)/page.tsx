import Link from "next/link";
import { PlayerIndexTable } from "@/components/player/PlayerIndexTable";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const players = await prisma.player.findMany({
    where:
      term.length > 0
        ? {
            OR: [
              { ssn: { contains: term } },
              { firstName: { contains: term } },
              { lastName: { contains: term } },
            ],
          }
        : undefined,
    orderBy: { updatedAt: "desc" },
    take: term.length > 0 ? 100 : 30,
  });

  const rows = players.map((p) => ({
    id: p.id,
    ssn: p.ssn,
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth.toISOString().slice(0, 10),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-normal tracking-wide">
            <span className="text-[#6fdc5c]">aegis&gt;</span> player_index
          </h1>
          <p className="mt-1 text-sm text-[#6fdc5c]/80">
            Search by SSN or name. Empty query lists recent records.
          </p>
        </div>
        <Link
          href="/players/new"
          className="shrink-0 border border-[#39ff14] px-3 py-1 font-mono text-sm text-[#39ff14] hover:bg-[#39ff14]/10 focus:outline focus:outline-2 focus:outline-[#39ff14]"
        >
          [ NEW_RECORD ]
        </Link>
      </div>

      <form method="get" className="flex flex-wrap gap-2 border border-[#39ff14]/50 bg-black p-3">
        <label className="sr-only" htmlFor="q">
          Query
        </label>
        <input
          id="q"
          name="q"
          defaultValue={term}
          placeholder="SSN / first / last..."
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

      <div className="overflow-x-auto border border-[#39ff14]/40">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#39ff14]/40 bg-black text-[#6fdc5c]">
              <th className="p-2 font-normal">SSN</th>
              <th className="p-2 font-normal">Name</th>
              <th className="p-2 font-normal">DOB</th>
              <th className="p-2 font-normal">Updated</th>
              <th className="p-2 font-normal" />
            </tr>
          </thead>
          <PlayerIndexTable players={rows} />
        </table>
      </div>
    </div>
  );
}