import Link from "next/link";
import { createOrganization } from "@/lib/actions/organizations";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationLabels";
import { organizationTypeValues } from "@/lib/validations";

export default async function NewOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ nameBlocked?: string }>;
}) {
  const sp = await searchParams;
  const nameBlocked = sp.nameBlocked === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> new_organization
        </h1>
        <Link
          href="/organizations"
          className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline"
        >
          &larr; [ ORG_INDEX ]
        </Link>
      </div>

      {nameBlocked && (
        <pre className="max-w-xl whitespace-pre-wrap border border-red-500/60 bg-black p-2 text-xs text-red-400">
          stderr: Name blocked by policy (matches name blacklist).
        </pre>
      )}

      <form
        action={createOrganization}
        className="max-w-xl space-y-4 border border-[#39ff14]/50 p-4"
      >
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue="STREET_GANG"
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          >
            {organizationTypeValues.map((v) => (
              <option key={v} value={v}>
                {ORGANIZATION_TYPE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
        <button
          type="submit"
          className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
        >
          [ CREATE_ORGANIZATION ]
        </button>
      </form>
    </div>
  );
}
