import Link from "next/link";
import { createCase } from "@/lib/actions/cases";
import {
  CASE_CATEGORY_LABELS,
  CASE_CATEGORY_ORDER,
} from "@/lib/caseLabels";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationLabels";
import { formatPlayerLabel } from "@/lib/playerDisplay";
import { prisma } from "@/lib/prisma";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ nameBlocked?: string }>;
}) {
  const sp = await searchParams;
  const nameBlocked = sp.nameBlocked === "1";

  const [players, organizations] = await Promise.all([
    prisma.player.findMany({
      orderBy: { discordUser: "asc" },
      take: 500,
      select: { id: true, discordUser: true, discordId: true },
    }),
    prisma.organization.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> new_case
        </h1>
        <Link
          href="/cases"
          className="mt-2 inline-block text-sm text-[#6fdc5c] hover:underline"
        >
          &larr; [ BACK_TO_CASES ]
        </Link>
      </div>

      {nameBlocked && (
        <pre className="whitespace-pre-wrap border border-red-500/60 bg-black p-2 text-xs text-red-400">
          stderr: Name blocked by policy (matches name blacklist).
        </pre>
      )}

      <form action={createCase} className="space-y-4 border border-[#39ff14]/50 p-4">
        <div>
          <label className="block text-xs text-[#6fdc5c]" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue="COMPLIANCE_REPORTING"
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          >
            {CASE_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CASE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <Field label="Title" name="title" required />

        <div>
          <label className="block text-xs text-[#6fdc5c]" htmlFor="body">
            Case data
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={8}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>

        <p className="text-xs text-[#6fdc5c]/80">
          Link at least one: existing user of interest, group of interest, or raw
          Discord ID + user (creates a user of interest if needed).
        </p>

        <div>
          <label className="block text-xs text-[#6fdc5c]" htmlFor="playerId">
            User of interest (existing)
          </label>
          <select
            id="playerId"
            name="playerId"
            defaultValue=""
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          >
            <option value="">— none —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {formatPlayerLabel(p)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Discord ID (raw)" name="discordId" />
          <Field label="Discord user (raw)" name="discordUser" />
        </div>

        <div>
          <label className="block text-xs text-[#6fdc5c]" htmlFor="organizationId">
            Group of interest
          </label>
          <select
            id="organizationId"
            name="organizationId"
            defaultValue=""
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          >
            <option value="">— none —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({ORGANIZATION_TYPE_LABELS[o.type]})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="border border-[#39ff14] px-4 py-2 text-[#39ff14] hover:bg-[#39ff14]/10"
        >
          [ FILE_CASE ]
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-[#6fdc5c]" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
      />
    </div>
  );
}
