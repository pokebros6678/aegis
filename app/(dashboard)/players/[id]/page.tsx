import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayerOverviewForm } from "@/components/player/PlayerOverviewForm";
import {
  createAffiliation,
  createEmployment,
  createVehicle,
  deleteAffiliation,
  deleteEmployment,
  deletePlayer,
  deleteVehicle,
} from "@/lib/actions/intel";
import { prisma } from "@/lib/prisma";

const TABS = ["overview", "vehicles", "affiliations", "employment"] as const;
type Tab = (typeof TABS)[number];

function tabClass(active: boolean) {
  return active
    ? "border-[#39ff14] text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.2)]"
    : "border-[#39ff14]/30 text-[#6fdc5c] hover:border-[#39ff14]/60";
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabRaw } = await searchParams;
  const tab: Tab = TABS.includes(tabRaw as Tab)
    ? (tabRaw as Tab)
    : "overview";

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      vehicles: { orderBy: { id: "desc" } },
      affiliations: {
        orderBy: { id: "desc" },
        include: { relatedPlayer: true },
      },
      employment: { orderBy: { id: "desc" } },
    },
  });

  if (!player) notFound();

  const others = await prisma.player.findMany({
    where: { id: { not: id } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, ssn: true, firstName: true, lastName: true },
  });

  const tabHref = (t: Tab) => `/players/${id}?tab=${t}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg">
            <span className="text-[#6fdc5c]">aegis&gt;</span> subject_file
          </h1>
          <p className="mt-1 font-mono text-sm text-[#6fdc5c]/90">
            {player.lastName}, {player.firstName}{" "}
            <span className="text-[#39ff14]">::</span> SSN{" "}
            <span className="text-[#39ff14]">{player.ssn}</span>
          </p>
          <Link
            href="/"
            className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline"
          >
            &larr; [ INDEX ]
          </Link>
        </div>
        <form action={deletePlayer.bind(null, player.id)}>
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
          <h2 className="text-sm text-[#6fdc5c]">&gt; core_identity</h2>
          <PlayerOverviewForm player={player} />
        </section>
      )}

      {tab === "vehicles" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; vehicles</h2>
          <form
            action={createVehicle}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <Field name="plate" label="Plate" />
            <Field name="model" label="Model" />
            <Field name="color" label="Color" />
            <div className="sm:col-span-2">
              <Field name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ ADD_VEHICLE ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Plate</th>
                  <th className="p-2 font-normal">Model</th>
                  <th className="p-2 font-normal">Color</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-[#6fdc5c]/70">
                      no vehicles on file.
                    </td>
                  </tr>
                ) : (
                  player.vehicles.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">{v.plate ?? "\u2014"}</td>
                      <td className="p-2">{v.model ?? "\u2014"}</td>
                      <td className="p-2">{v.color ?? "\u2014"}</td>
                      <td className="p-2 text-[#6fdc5c]/90">{v.notes ?? "\u2014"}</td>
                      <td className="p-2">
                        <form
                          action={deleteVehicle.bind(null, v.id, player.id)}
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

      {tab === "affiliations" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; affiliations</h2>
          <form
            action={createAffiliation}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <div className="sm:col-span-2">
              <Field name="name" label="Organization / crew" required />
            </div>
            <Field name="role" label="Role" />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="relatedPlayerId">
                Linked profile (optional)
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
                    {o.lastName}, {o.firstName} ({o.ssn})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Field name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ ADD_AFFILIATION ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Name</th>
                  <th className="p-2 font-normal">Role</th>
                  <th className="p-2 font-normal">Linked</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.affiliations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-3 text-[#6fdc5c]/70">
                      no affiliations on file.
                    </td>
                  </tr>
                ) : (
                  player.affiliations.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">{a.name}</td>
                      <td className="p-2">{a.role ?? "—"}</td>
                      <td className="p-2">
                        {a.relatedPlayer ? (
                          <Link
                            href={`/players/${a.relatedPlayer.id}?tab=overview`}
                            className="text-[#39ff14] underline-offset-2 hover:underline"
                          >
                            {a.relatedPlayer.lastName}, {a.relatedPlayer.firstName}{" "}
                            <span className="text-[#6fdc5c]">
                              ({a.relatedPlayer.ssn})
                            </span>
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-2 text-[#6fdc5c]/90">{a.notes ?? "—"}</td>
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

      {tab === "employment" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; employment_history</h2>
          <form
            action={createEmployment}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <div className="sm:col-span-2">
              <Field name="employer" label="Employer" required />
            </div>
            <Field name="title" label="Title" />
            <div />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="startDate">
                Start
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="endDate">
                End
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div className="sm:col-span-2">
              <Field name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ ADD_EMPLOYMENT ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Employer</th>
                  <th className="p-2 font-normal">Title</th>
                  <th className="p-2 font-normal">Start</th>
                  <th className="p-2 font-normal">End</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.employment.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-[#6fdc5c]/70">
                      no employment on file.
                    </td>
                  </tr>
                ) : (
                  player.employment.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="p-2">{e.employer}</td>
                      <td className="p-2">{e.title ?? "\u2014"}</td>
                      <td className="p-2 text-[#6fdc5c]/90">
                        {e.startDate
                          ? e.startDate.toISOString().slice(0, 10)
                          : "\u2014"}
                      </td>
                      <td className="p-2 text-[#6fdc5c]/90">
                        {e.endDate ? e.endDate.toISOString().slice(0, 10) : "\u2014"}
                      </td>
                      <td className="p-2 text-[#6fdc5c]/90">{e.notes ?? "\u2014"}</td>
                      <td className="p-2">
                        <form
                          action={deleteEmployment.bind(null, e.id, player.id)}
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
