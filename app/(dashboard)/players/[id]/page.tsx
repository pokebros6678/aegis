import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PlayerOverviewForm } from "@/components/player/PlayerOverviewForm";
import {
  createAffiliation,
  deleteAffiliation,
  deletePlayer,
  updateAffiliation,
} from "@/lib/actions/intel";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationLabels";
import { formatPlayerLabel } from "@/lib/playerDisplay";
import { prisma } from "@/lib/prisma";

const TABS = ["overview", "affiliations"] as const;
type Tab = (typeof TABS)[number];

function tabClass(active: boolean) {
  return active
    ? "border-aegis-lime text-aegis-lime shadow-[0_0_10px_color-mix(in_srgb,var(--aegis-accent)_25%,transparent)]"
    : "border-aegis-lime/30 text-aegis-lime-dim hover:border-aegis-lime/60";
}

function Field({
  htmlId,
  name,
  label,
  defaultValue,
  required,
}: {
  htmlId: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-[#6fdc5c]" htmlFor={htmlId}>
        {label}
      </label>
      <input
        id={htmlId}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
      />
    </div>
  );
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; editAffiliationId?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "overview";
  const editAffiliationId = sp.editAffiliationId ?? "";

  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      affiliations: {
        orderBy: { id: "desc" },
        include: {
          organization: true,
          relatedPlayer: true,
        },
      },
    },
  });

  if (!player) notFound();

  const [others, organizations] = await Promise.all([
    prisma.player.findMany({
      where: { id: { not: id } },
      orderBy: [{ discordUser: "asc" }],
      select: { id: true, discordId: true, discordUser: true },
    }),
    prisma.organization.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
  ]);

  const tabHref = (t: Tab) => `/players/${id}?tab=${t}`;

  const affiliationEditing =
    editAffiliationId &&
    player.affiliations.some((a) => a.id === editAffiliationId)
      ? player.affiliations.find((a) => a.id === editAffiliationId)!
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg">
            <span className="text-[#6fdc5c]">aegis&gt;</span> subject_file
          </h1>
          <p className="mt-1 font-mono text-sm text-[#6fdc5c]/90">
            @{player.discordUser}{" "}
            <span className="text-[#39ff14]">::</span> Discord ID{" "}
            <span className="text-[#39ff14]">{player.discordId}</span>
          </p>
          <Link
            href="/"
            className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline"
          >
            &larr; [ INDEX ]
          </Link>
        </div>
        {isAdmin && (
          <form action={deletePlayer.bind(null, player.id)}>
            <button
              type="submit"
              className="border border-red-500/70 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              [ PURGE_RECORD ]
            </button>
          </form>
        )}
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
          <h2 className="text-sm text-[#6fdc5c]">&gt; core_identity</h2>
          <PlayerOverviewForm player={player} />
        </section>
      )}

      {tab === "affiliations" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; affiliations</h2>
          {affiliationEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateAffiliation}
                className="space-y-4 border border-[#39ff14]/30 p-4"
              >
                <input type="hidden" name="playerId" value={player.id} />
                <input
                  type="hidden"
                  name="affiliationId"
                  value={affiliationEditing.id}
                />
                <p className="text-xs text-[#6fdc5c]">&gt; related_groups</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-[#6fdc5c]" htmlFor="ea-org">
                      Related group
                    </label>
                    <select
                      id="ea-org"
                      name="organizationId"
                      defaultValue={affiliationEditing.organizationId ?? ""}
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
                  <div>
                    <label className="text-xs text-[#6fdc5c]" htmlFor="rel-edit">
                      Linked profile
                    </label>
                    <select
                      id="rel-edit"
                      name="relatedPlayerId"
                      defaultValue={affiliationEditing.relatedPlayerId ?? ""}
                      className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                    >
                      <option value="">— none —</option>
                      {others.map((o) => (
                        <option key={o.id} value={o.id}>
                          {formatPlayerLabel(o)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Field
                  htmlId="ea-role"
                  name="role"
                  label="Role"
                  defaultValue={affiliationEditing.role ?? ""}
                />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="ea-notes">
                    Notes
                  </label>
                  <textarea
                    id="ea-notes"
                    name="notes"
                    rows={3}
                    defaultValue={affiliationEditing.notes ?? ""}
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
                    href={tabHref("affiliations")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
          <form
            action={createAffiliation}
            className="space-y-4 border border-[#39ff14]/40 p-4"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <p className="text-xs text-[#6fdc5c]">&gt; related_groups</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-[#6fdc5c]" htmlFor="na-org">
                  Related group
                </label>
                <select
                  id="na-org"
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
              <div>
                <label className="text-xs text-[#6fdc5c]" htmlFor="relatedPlayerId">
                  Linked profile
                </label>
                <select
                  id="relatedPlayerId"
                  name="relatedPlayerId"
                  defaultValue=""
                  className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                >
                  <option value="">— none —</option>
                  {others.map((o) => (
                    <option key={o.id} value={o.id}>
                      {formatPlayerLabel(o)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Field htmlId="na-role" name="role" label="Role" />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="na-notes">
                Notes
              </label>
              <textarea
                id="na-notes"
                name="notes"
                rows={3}
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <button
              type="submit"
              className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
            >
              [ ADD_AFFILIATION ]
            </button>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Related group</th>
                  <th className="p-2 font-normal">Role</th>
                  <th className="p-2 font-normal">Linked profile</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.affiliations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-[#6fdc5c]/70">
                      no affiliations on file.
                    </td>
                  </tr>
                ) : (
                  player.affiliations.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">
                        {a.organization ? (
                          <Link
                            href={`/organizations/${a.organization.id}?tab=overview`}
                            className="text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            {a.organization.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2">{a.role ?? "—"}</td>
                      <td className="p-2">
                        {a.relatedPlayer ? (
                          <Link
                            href={`/players/${a.relatedPlayer.id}?tab=overview`}
                            className="text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            {formatPlayerLabel(a.relatedPlayer)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 text-[#6fdc5c]/90">{a.notes ?? "—"}</td>
                      <td className="p-2">
                        <Link
                          href={`/players/${id}?tab=affiliations&editAffiliationId=${a.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
                      <td className="p-2">
                        <form
                          action={deleteAffiliation.bind(null, a.id, player.id)}
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
