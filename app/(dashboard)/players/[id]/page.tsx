import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PlayerOverviewForm } from "@/components/player/PlayerOverviewForm";
import {
  createAffiliation,
  createEmployment,
  createPlayerMovement,
  createVehicle,
  deleteAffiliation,
  deleteEmployment,
  deletePlayer,
  deletePlayerMovement,
  deleteVehicle,
  updateAffiliation,
  updateEmployment,
  updatePlayerMovement,
  updateVehicle,
} from "@/lib/actions/intel";
import { prisma } from "@/lib/prisma";

const TABS = [
  "overview",
  "vehicles",
  "affiliations",
  "employment",
  "movements",
] as const;
type Tab = (typeof TABS)[number];

function tabClass(active: boolean) {
  return active
    ? "border-aegis-lime text-aegis-lime shadow-[0_0_10px_color-mix(in_srgb,var(--aegis-accent)_25%,transparent)]"
    : "border-aegis-lime/30 text-aegis-lime-dim hover:border-aegis-lime/60";
}

function toDatetimeLocalValue(d: Date): string {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return x.toISOString().slice(0, 16);
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    editVehicleId?: string;
    editAffiliationId?: string;
    editEmploymentId?: string;
    editMovementId?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "overview";
  const editVehicleId = sp.editVehicleId ?? "";
  const editAffiliationId = sp.editAffiliationId ?? "";
  const editEmploymentId = sp.editEmploymentId ?? "";
  const editMovementId = sp.editMovementId ?? "";

  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      vehicles: { orderBy: { id: "desc" } },
      affiliations: {
        orderBy: { id: "desc" },
        include: { relatedPlayer: true },
      },
      employment: { orderBy: { id: "desc" } },
      movements: { orderBy: { seenAt: "desc" } },
    },
  });

  if (!player) notFound();

  const others = await prisma.player.findMany({
    where: { id: { not: id } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, ssn: true, firstName: true, lastName: true },
  });

  const tabHref = (t: Tab) => `/players/${id}?tab=${t}`;

  const vehicleEditing =
    editVehicleId &&
    player.vehicles.some((v) => v.id === editVehicleId)
      ? player.vehicles.find((v) => v.id === editVehicleId)!
      : null;
  const affiliationEditing =
    editAffiliationId &&
    player.affiliations.some((a) => a.id === editAffiliationId)
      ? player.affiliations.find((a) => a.id === editAffiliationId)!
      : null;
  const employmentEditing =
    editEmploymentId &&
    player.employment.some((e) => e.id === editEmploymentId)
      ? player.employment.find((e) => e.id === editEmploymentId)!
      : null;
  const movementEditing =
    editMovementId &&
    player.movements.some((m) => m.id === editMovementId)
      ? player.movements.find((m) => m.id === editMovementId)!
      : null;

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

      {tab === "vehicles" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; vehicles</h2>
          {vehicleEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateVehicle}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="playerId" value={player.id} />
                <input
                  type="hidden"
                  name="vehicleId"
                  value={vehicleEditing.id}
                />
                <Field
                  htmlId="ev-plate"
                  name="plate"
                  label="Plate"
                  defaultValue={vehicleEditing.plate ?? ""}
                />
                <Field
                  htmlId="ev-model"
                  name="model"
                  label="Model"
                  defaultValue={vehicleEditing.model ?? ""}
                />
                <Field
                  htmlId="ev-color"
                  name="color"
                  label="Color"
                  defaultValue={vehicleEditing.color ?? ""}
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="ev-notes"
                    name="notes"
                    label="Notes"
                    defaultValue={vehicleEditing.notes ?? ""}
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
                    href={tabHref("vehicles")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
          <form
            action={createVehicle}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <Field htmlId="nv-plate" name="plate" label="Plate" />
            <Field htmlId="nv-model" name="model" label="Model" />
            <Field htmlId="nv-color" name="color" label="Color" />
            <div className="sm:col-span-2">
              <Field htmlId="nv-notes" name="notes" label="Notes" />
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
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-[#6fdc5c]/70">
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
                        <Link
                          href={`/players/${id}?tab=vehicles&editVehicleId=${v.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
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
          {affiliationEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateAffiliation}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="playerId" value={player.id} />
                <input
                  type="hidden"
                  name="affiliationId"
                  value={affiliationEditing.id}
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="ea-name"
                    name="name"
                    label="Organization / crew"
                    required
                    defaultValue={affiliationEditing.name}
                  />
                </div>
                <Field
                  htmlId="ea-role"
                  name="role"
                  label="Role"
                  defaultValue={affiliationEditing.role ?? ""}
                />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="rel-edit">
                    Linked profile (optional)
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
                        {o.lastName}, {o.firstName} ({o.ssn})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Field
                    htmlId="ea-notes"
                    name="notes"
                    label="Notes"
                    defaultValue={affiliationEditing.notes ?? ""}
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
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <div className="sm:col-span-2">
              <Field
                htmlId="na-name"
                name="name"
                label="Organization / crew"
                required
              />
            </div>
            <Field htmlId="na-role" name="role" label="Role" />
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
              <Field htmlId="na-notes" name="notes" label="Notes" />
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

      {tab === "employment" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; employment_history</h2>
          {employmentEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updateEmployment}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="playerId" value={player.id} />
                <input
                  type="hidden"
                  name="employmentId"
                  value={employmentEditing.id}
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="ee-employer"
                    name="employer"
                    label="Employer"
                    required
                    defaultValue={employmentEditing.employer}
                  />
                </div>
                <Field
                  htmlId="ee-title"
                  name="title"
                  label="Title"
                  defaultValue={employmentEditing.title ?? ""}
                />
                <div />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="es">
                    Start
                  </label>
                  <input
                    id="es"
                    name="startDate"
                    type="date"
                    defaultValue={
                      employmentEditing.startDate
                        ? employmentEditing.startDate
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="ee">
                    End
                  </label>
                  <input
                    id="ee"
                    name="endDate"
                    type="date"
                    defaultValue={
                      employmentEditing.endDate
                        ? employmentEditing.endDate
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Field
                    htmlId="ee-notes"
                    name="notes"
                    label="Notes"
                    defaultValue={employmentEditing.notes ?? ""}
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
                    href={tabHref("employment")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
          <form
            action={createEmployment}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <div className="sm:col-span-2">
              <Field
                htmlId="ne-employer"
                name="employer"
                label="Employer"
                required
              />
            </div>
            <Field htmlId="ne-title" name="title" label="Title" />
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
              <Field htmlId="ne-notes" name="notes" label="Notes" />
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
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.employment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-3 text-[#6fdc5c]/70">
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
                        <Link
                          href={`/players/${id}?tab=employment&editEmploymentId=${e.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
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

      {tab === "movements" && (
        <section className="space-y-6">
          <h2 className="text-sm text-[#6fdc5c]">&gt; movements / spottings</h2>
          {movementEditing && (
            <div className="space-y-2 border border-amber-500/50 p-4">
              <p className="text-xs text-amber-400">editing record</p>
              <form
                action={updatePlayerMovement}
                className="grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="playerId" value={player.id} />
                <input
                  type="hidden"
                  name="movementId"
                  value={movementEditing.id}
                />
                <div>
                  <label className="text-xs text-[#6fdc5c]" htmlFor="seenAt-e">
                    Seen at
                  </label>
                  <input
                    id="seenAt-e"
                    name="seenAt"
                    type="datetime-local"
                    required
                    defaultValue={toDatetimeLocalValue(movementEditing.seenAt)}
                    className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                </div>
                <div />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="me-loc"
                    name="locationDescription"
                    label="Location / description"
                    required
                    defaultValue={movementEditing.locationDescription}
                  />
                </div>
                <Field
                  htmlId="me-src"
                  name="source"
                  label="Source (unit, CCTV, …)"
                  defaultValue={movementEditing.source ?? ""}
                />
                <div className="sm:col-span-2">
                  <Field
                    htmlId="me-notes"
                    name="notes"
                    label="Notes"
                    defaultValue={movementEditing.notes ?? ""}
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
                    href={tabHref("movements")}
                    className="border border-[#6fdc5c]/50 px-4 py-1 text-sm text-[#6fdc5c] hover:bg-[#39ff14]/10"
                  >
                    [ CANCEL ]
                  </Link>
                </div>
              </form>
            </div>
          )}
          <form
            action={createPlayerMovement}
            className="grid gap-3 border border-[#39ff14]/40 p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="playerId" value={player.id} />
            <div>
              <label className="text-xs text-[#6fdc5c]" htmlFor="seenAt-n">
                Seen at
              </label>
              <input
                id="seenAt-n"
                name="seenAt"
                type="datetime-local"
                required
                defaultValue={toDatetimeLocalValue(new Date())}
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div />
            <div className="sm:col-span-2">
              <Field
                htmlId="nm-loc"
                name="locationDescription"
                label="Location / description"
                required
              />
            </div>
            <Field htmlId="nm-src" name="source" label="Source (unit, CCTV, …)" />
            <div className="sm:col-span-2">
              <Field htmlId="nm-notes" name="notes" label="Notes" />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
              >
                [ LOG_MOVEMENT ]
              </button>
            </div>
          </form>
          <div className="overflow-x-auto border border-[#39ff14]/40">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#39ff14]/40 text-[#6fdc5c]">
                  <th className="p-2 font-normal">Seen</th>
                  <th className="p-2 font-normal">Location</th>
                  <th className="p-2 font-normal">Source</th>
                  <th className="p-2 font-normal">Notes</th>
                  <th className="p-2 font-normal" />
                  <th className="p-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {player.movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-[#6fdc5c]/70">
                      no movements on file.
                    </td>
                  </tr>
                ) : (
                  player.movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[#39ff14]/20 hover:bg-[#39ff14]/5"
                    >
                      <td className="whitespace-nowrap p-2 font-mono text-xs text-[#6fdc5c]/90">
                        {m.seenAt.toISOString().replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="p-2">{m.locationDescription}</td>
                      <td className="p-2">{m.source ?? "—"}</td>
                      <td className="p-2 text-[#6fdc5c]/90">{m.notes ?? "—"}</td>
                      <td className="p-2">
                        <Link
                          href={`/players/${id}?tab=movements&editMovementId=${m.id}`}
                          className="text-xs text-[#39ff14] hover:underline"
                        >
                          [ EDIT ]
                        </Link>
                      </td>
                      <td className="p-2">
                        <form
                          action={deletePlayerMovement.bind(null, m.id, player.id)}
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
