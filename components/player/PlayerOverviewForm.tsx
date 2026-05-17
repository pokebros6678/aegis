"use client";

import { useActionState } from "react";
import {
  updatePlayerAction,
  type IntelFormState,
} from "@/lib/actions/intel";

type Player = {
  id: string;
  discordId: string;
  discordUser: string;
  notes: string | null;
};

export function PlayerOverviewForm({ player }: { player: Player }) {
  const [state, formAction, pending] = useActionState<
    IntelFormState,
    FormData
  >(updatePlayerAction, null);

  return (
    <form action={formAction} className="space-y-4 border border-[#39ff14]/50 p-4">
      <input type="hidden" name="playerId" value={player.id} />
      {state != null && "error" in state && state.error?._form && (
        <pre className="whitespace-pre-wrap border border-red-500/60 bg-black p-2 text-xs text-red-400">
          stderr: {state.error._form.join("\n")}
        </pre>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="discordId">
            Discord ID
          </label>
          <input
            id="discordId"
            name="discordId"
            required
            defaultValue={player.discordId}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
          {state != null && "error" in state && state.error?.discordId && (
            <p className="mt-1 text-xs text-red-400">{state.error.discordId[0]}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="discordUser">
            Discord user
          </label>
          <input
            id="discordUser"
            name="discordUser"
            required
            defaultValue={player.discordUser}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
          {state != null && "error" in state && state.error?.discordUser && (
            <p className="mt-1 text-xs text-red-400">{state.error.discordUser[0]}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-[#6fdc5c]" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={player.notes ?? ""}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10 disabled:opacity-50"
      >
        {pending ? "[ SAVING… ]" : "[ SAVE_OVERVIEW ]"}
      </button>
    </form>
  );
}
