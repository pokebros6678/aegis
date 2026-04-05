import Link from "next/link";
import { notFound } from "next/navigation";
import { OrganizationOverviewForm } from "@/components/organization/OrganizationOverviewForm";
import {
  createOrganizationIntel,
  createOrganizationLocation,
  createOrganizationMember,
  createOrganizationRelation,
  deleteOrganization,
  deleteOrganizationIntel,
  deleteOrganizationLocation,
  deleteOrganizationMember,
  deleteOrganizationRelation,
  updateOrganizationIntel,
  updateOrganizationLocation,
  updateOrganizationMember,
  updateOrganizationRelation,
} from "@/lib/actions/organizations";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationLabels";
import { prisma } from "@/lib/prisma";

const TABS = [
  "overview",
  "members",
  "relations",
  "intelligence",
  "locations",
] as const;
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
  searchParams: Promise<{
    tab?: string;
    editMemberId?: string;
    editRelationId?: string;
    editIntelId?: string;
    editLocationId?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "overview";
  const editMemberId = sp.editMemberId ?? "";
  const editRelationId = sp.editRelationId ?? "";
  const editIntelId = sp.editIntelId ?? "";
  const editLocationId = sp.editLocationId ?? "";

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
      locations: { orderBy: { updatedAt: "desc" } },
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

  const memberEditing =
    editMemberId && org.members.some((m) => m.id === editMemberId)
      ? org.members.find((m) => m.id === editMemberId)!
      : null;
  const relationEditing =
    editRelationId && org.relations.some((r) => r.id === editRelationId)
      ? org.relations.find((r) => r.id === editRelationId)!
      : null;
  const intelEditing =
    editIntelId && org.intel.some((i) => i.id === editIntelId)
      ? org.intel.find((i) => i.id === editIntelId)!
      : null;
  const locationEditing =
    editLocationId && org.locations.some((l) => l.id === editLocationId)
      ? org.locations.find((l) => l.id === editLocationId)!
      : null;

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
          {memberEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateOrganizationMember}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="organizationId" value={org.id} />
                <input type="hidden" name="memberId" value={memberEditing.id} />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="mem-p-edit">
                    Linked player (optional)
                  </label>
                  <select
                    id="mem-p-edit"
                    name="playerId"
                    defaultValue={memberEditing.playerId ?? ""}
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
                <Field
                  htmlId="mem-a-edit"
                  name="alias"
                  label="Alias / street name"
                  defaultValue={memberEditing.alias ?? ""}
                />
                <Field
                  htmlId="mem-r-edit"
                  name="role"
                  label="Role"
                  defaultValue={memberEditing.role ?? ""}
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="mem-n-edit"
                    name="notes"
                    label="Notes"
                    defaultValue={memberEditing.notes ?? ""}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    [ SAVE ]
                  </button>
                  <Link
                    href={tabHref("members")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
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
            <Field htmlId="mem-a-new" name="alias" label="Alias / street name (if no player)" />
            <Field htmlId="mem-r-new" name="role" label="Role" />
            <div className="sm:col-span-2">
              <Field htmlId="mem-n-new" name="notes" label="Notes" />
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
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-[#6fdc5c]/70">
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
                        <Link
                          href={`/organizations/${id}?tab=members&editMemberId=${m.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
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
          {relationEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateOrganizationRelation}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="organizationId" value={org.id} />
                <input
                  type="hidden"
                  name="relationId"
                  value={relationEditing.id}
                />
                <div className="sm:col-span-2">
                  <label className="text-xs text-[#6fdc5c]" htmlFor="peer-e">
                    Organization on file (optional)
                  </label>
                  <select
                    id="peer-e"
                    name="peerOrganizationId"
                    defaultValue={relationEditing.peerOrganizationId ?? ""}
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
                    htmlId="rel-ext-e"
                    name="externalLabel"
                    label="External entity (if not on file)"
                    defaultValue={relationEditing.externalLabel ?? ""}
                  />
                </div>
                <Field
                  htmlId="rel-k-e"
                  name="relationKind"
                  label="Kind (alliance, rivalry, …)"
                  defaultValue={relationEditing.relationKind ?? ""}
                />
                <div />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="rel-n-e"
                    name="notes"
                    label="Notes"
                    defaultValue={relationEditing.notes ?? ""}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    [ SAVE ]
                  </button>
                  <Link
                    href={tabHref("relations")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
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
                htmlId="rel-ext-n"
                name="externalLabel"
                label="External entity (if not on file)"
              />
            </div>
            <Field htmlId="rel-k-n" name="relationKind" label="Kind (alliance, rivalry, …)" />
            <div />
            <div className="sm:col-span-2">
              <Field htmlId="rel-n-n" name="notes" label="Notes" />
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
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.relations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-[#6fdc5c]/70">
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
                        <Link
                          href={`/organizations/${id}?tab=relations&editRelationId=${r.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
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
          {intelEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form action={updateOrganizationIntel} className="grid gap-3">
                <input type="hidden" name="organizationId" value={org.id} />
                <input type="hidden" name="intelId" value={intelEditing.id} />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="intel-t-e">
                    Title
                  </label>
                  <input
                    id="intel-t-e"
                    name="title"
                    required
                    defaultValue={intelEditing.title}
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="intel-b-e">
                    Body
                  </label>
                  <textarea
                    id="intel-b-e"
                    name="body"
                    rows={6}
                    defaultValue={intelEditing.body ?? ""}
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    [ SAVE ]
                  </button>
                  <Link
                    href={tabHref("intelligence")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
          <form
            action={createOrganizationIntel}
            className="grid gap-3 border border-[#39ff14]/40 p-4"
          >
            <input type="hidden" name="organizationId" value={org.id} />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="intel-t-n">
                Title
              </label>
              <input
                id="intel-t-n"
                name="title"
                required
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="intel-b-n">
                Body
              </label>
              <textarea
                id="intel-b-n"
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
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.intel.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-[#6fdc5c]/70">
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
                        <Link
                          href={`/organizations/${id}?tab=intelligence&editIntelId=${row.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
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

      {tab === "locations" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; locations / properties</h2>
          {locationEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateOrganizationLocation}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="organizationId" value={org.id} />
                <input
                  type="hidden"
                  name="locationId"
                  value={locationEditing.id}
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="loc-l-e"
                    name="label"
                    label="Label"
                    required
                    defaultValue={locationEditing.label}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-[#6fdc5c]" htmlFor="loc-addr-e">
                    Address
                  </label>
                  <textarea
                    id="loc-addr-e"
                    name="address"
                    rows={3}
                    defaultValue={locationEditing.address ?? ""}
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <Field
                  htmlId="loc-k-e"
                  name="kind"
                  label="Kind (safehouse, business, …)"
                  defaultValue={locationEditing.kind ?? ""}
                />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="loc-acq-e">
                    Acquired
                  </label>
                  <input
                    id="loc-acq-e"
                    name="acquiredAt"
                    type="date"
                    defaultValue={
                      locationEditing.acquiredAt
                        ? locationEditing.acquiredAt
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    htmlId="loc-n-e"
                    name="notes"
                    label="Notes"
                    defaultValue={locationEditing.notes ?? ""}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    [ SAVE ]
                  </button>
                  <Link
                    href={tabHref("locations")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
          <form
            action={createOrganizationLocation}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="organizationId" value={org.id} />
            <div className="sm:col-span-2">
              <Field htmlId="loc-l-n" name="label" label="Label" required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[#6fdc5c]" htmlFor="loc-addr-n">
                Address
              </label>
              <textarea
                id="loc-addr-n"
                name="address"
                rows={3}
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <Field htmlId="loc-k-n" name="kind" label="Kind (safehouse, business, …)" />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="loc-acq-n">
                Acquired
              </label>
              <input
                id="loc-acq-n"
                name="acquiredAt"
                type="date"
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div className="sm:col-span-2">
              <Field htmlId="loc-n-n" name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ ADD_LOCATION ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Label</th>
                  <th className="p-2 font-normal">Kind</th>
                  <th className="p-2 font-normal">Address</th>
                  <th className="p-2 font-normal">Acquired</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {org.locations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-3 text-[#6fdc5c]/70">
                      no locations on file.
                    </td>
                  </tr>
                ) : (
                  org.locations.map((loc) => (
                    <tr
                      key={loc.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">{loc.label}</td>
                      <td className="p-2">{loc.kind ?? "—"}</td>
                      <td className="max-w-xs whitespace-pre-wrap p-2 text-[#6fdc5c]/90">
                        {loc.address ?? "—"}
                      </td>
                      <td className="p-2 text-[#6fdc5c]/90">
                        {loc.acquiredAt
                          ? loc.acquiredAt.toISOString().slice(0, 10)
                          : "—"}
                      </td>
                      <td className="p-2 text-[#6fdc5c]/90">{loc.notes ?? "—"}</td>
                      <td className="p-2">
                        <Link
                          href={`/organizations/${id}?tab=locations&editLocationId=${loc.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
                      <td className="p-2">
                        <form
                          action={deleteOrganizationLocation.bind(
                            null,
                            loc.id,
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
  defaultValue,
  htmlId,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  htmlId?: string;
}) {
  const id = htmlId ?? name;
  return (
    <div>
      <label className="text-xs text-[#6fdc5c]" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
      />
    </div>
  );
}
