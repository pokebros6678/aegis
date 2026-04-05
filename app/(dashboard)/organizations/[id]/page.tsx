import Link from "next/link";
import { notFound } from "next/navigation";
import { OrganizationOverviewForm } from "@/components/organization/OrganizationOverviewForm";
import {
  createOrganizationIntel,
  createOrganizationMember,
  createOrganizationRelation,
  deleteOrganization,
  deleteOrganizationIntel,
  deleteOrganizationMember,
  deleteOrganizationRelation,
} from "@/lib/actions/organizations";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationLabels";
import { prisma } from "@/lib/prisma";

const TABS = ["overview", "members", "relations", "intelligence"] as const;
type Tab = (typeof TABS)[number];

function tabClass(active: boolean) {
  return active
    ? "border-[#39ff14] text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)]"
    : "border-[#39ff14]/30 text-[#6fdc5c] hover:border-[#39ff14]/60";
}

export default async function OrganizationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabRaw } = await searchParams;
  const tab: Tab = TABS.includes(tabRaw as Tab) ? (tabRaw as Tab) : "overview";

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { id: "desc" },
        include: { player: true },
      },
      relations: {
        orderBy: { id: "desc" },
        include: { peerOrganization: true },
      },
      intel: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!org) notFound();

  const players = await prisma.player.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, ssn: true, firstName: true, lastName: true },
  });

  const peerOrgs = await prisma.organization.findMany({
    where: { id: { not: id } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true },
  });

  const tabHref = (t: Tab) => `/organizations/${id}?tab=${t}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg">
            <span className="text-[#6fdc5c]">aegis&gt;</span> organization_file
          </h1>
          <p className="mt-1 font-mono text-sm text-[#6fdc5c]/90">
            {org.name}{" "}
            <span className="text-[#39ff14]">::</span>{" "}
            <span className="text-[#39ff14]">
              {ORGANIZATION_TYPE_LABELS[org.type]}
            </span>
          </p>
          <Link
            href="/organizations"
            className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline"
          >
            &larr; [ ORG_INDEX ]
          </Link>
        </div>
        <form action={deleteOrganization.bind(null, org.id)}>
          <button
            type="submit"
            className="border border-red-500/70 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
          >
            [ PURGE_RECORD ]
          </button>
        </form>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-[#39ff14]/30 pb-2 font-mono text-sm">
        {TABS.map((t) => (
          <Link
            key={t}
            href={tabHref(t)}
            className={`border-b-2 px-2 py-1 ${tabClass(tab === t)}`}
          >
            [ {t.toUpperCase()} ]
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <section className="space-y-4">
          <h2 className="text-sm text-[#6fdc5c]">&gt; overview</h2>
          <OrganizationOverviewForm organization={org} />
        </section>
      )}

      {tab === "members" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; members</h2>
          <form
            action={createOrganizationMember}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="organizationId" value={org.id} />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="playerId">
                Linked player (optional)
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
                    {p.lastName}, {p.firstName} ({p.ssn})
                  </option>
                ))}
              </select>
            </div>
            <Field name="alias" label="Alias / street name (if no player)" />
            <Field name="role" label="Role" />
            <div className="sm:col-span-2">
              <Field name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ ADD_MEMBER ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Player / alias</th>
                  <th className="p-2 font-normal">Role</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-[#6fdc5c]/70">
                      no members on file.
                    </td>
                  </tr>
                ) : (
                  org.members.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">
                        {m.player ? (
                          <Link
                            href={`/players/${m.player.id}?tab=overview`}
                            className="text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            {m.player.lastName}, {m.player.firstName}{" "}
                            <span className="text-[#6fdc5c]">
                              ({m.player.ssn})
                            </span>
                          </Link>
                        ) : (
                          m.alias ?? "—"
                        )}
                      </td>
                      <td className="p-2">{m.role ?? "—"}</td>
                      <td className="p-2 text-[#6fdc5c]/90">{m.notes ?? "—"}</td>
                      <td className="p-2">
                        <form
                          action={deleteOrganizationMember.bind(
                            null,
                            m.id,
                            org.id,
                          )}
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:underline"
                          >
                            [ DEL ]
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "relations" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; relations</h2>
          <form
            action={createOrganizationRelation}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="organizationId" value={org.id} />
            <div className="sm:col-span-2">
              <label className="text-xs text-[#6fdc5c]" htmlFor="peerOrganizationId">
                Organization on file (optional)
              </label>
              <select
                id="peerOrganizationId"
                name="peerOrganizationId"
                defaultValue=""
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              >
                <option value="">— none —</option>
                {peerOrgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({ORGANIZATION_TYPE_LABELS[o.type]})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Field
                name="externalLabel"
                label="External entity (if not on file)"
              />
            </div>
            <Field name="relationKind" label="Kind (alliance, rivalry, …)" />
            <div />
            <div className="sm:col-span-2">
              <Field name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ ADD_RELATION ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Target</th>
                  <th className="p-2 font-normal">Kind</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.relations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-[#6fdc5c]/70">
                      no relations on file.
                    </td>
                  </tr>
                ) : (
                  org.relations.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">
                        {r.peerOrganization ? (
                          <Link
                            href={`/organizations/${r.peerOrganization.id}?tab=overview`}
                            className="text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            {r.peerOrganization.name}
                          </Link>
                        ) : (
                          r.externalLabel ?? "—"
                        )}
                      </td>
                      <td className="p-2">{r.relationKind ?? "—"}</td>
                      <td className="p-2 text-[#6fdc5c]/90">{r.notes ?? "—"}</td>
                      <td className="p-2">
                        <form
                          action={deleteOrganizationRelation.bind(
                            null,
                            r.id,
                            org.id,
                          )}
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:underline"
                          >
                            [ DEL ]
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "intelligence" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; intelligence</h2>
          <form
            action={createOrganizationIntel}
            className="grid gap-3 border border-[#39ff14]/40 p-4"
          >
            <input type="hidden" name="organizationId" value={org.id} />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                required
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="body">
                Body
              </label>
              <textarea
                id="body"
                name="body"
                rows={6}
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <button
              type="submit"
              className="w-fit border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
            >
              [ ADD_INTEL ]
            </button>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Title</th>
                  <th className="p-2 font-normal">Body</th>
                  <th className="p-2 font-normal">Updated</th>
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.intel.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-[#6fdc5c]/70">
                      no intelligence entries on file.
                    </td>
                  </tr>
                ) : (
                  org.intel.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2 align-top">{row.title}</td>
                      <td className="max-w-md whitespace-pre-wrap p-2 align-top text-[#6fdc5c]/90">
                        {row.body ?? "—"}
                      </td>
                      <td className="whitespace-nowrap p-2 align-top font-mono text-xs text-[#6fdc5c]/90">
                        {row.updatedAt.toISOString()}
                      </td>
                      <td className="p-2 align-top">
                        <form
                          action={deleteOrganizationIntel.bind(
                            null,
                            row.id,
                            org.id,
                          )}
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:underline"
                          >
                            [ DEL ]
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-[#6fdc5c]" htmlFor={name}>
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
