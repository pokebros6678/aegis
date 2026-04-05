"use client";

import { useActionState } from "react";
import {
  updatePlayerAction,
  type IntelFormState,
} from "@/lib/actions/intel";

type Player = {
  id: string;
  ssn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
};

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

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
          <label className="text-xs text-[#6fdc5c]" htmlFor="ssn">
            SSN
          </label>
          <input
            id="ssn"
            name="ssn"
            required
            defaultValue={player.ssn}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
          {state != null && "error" in state && state.error?.ssn && (
            <p className="mt-1 text-xs text-red-400">{state.error.ssn[0]}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="dateOfBirth">
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            defaultValue={fmt(player.dateOfBirth)}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            defaultValue={player.firstName}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            defaultValue={player.lastName}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-[#39ff14] px-4 py-2 text-[#39ff14] hover:bg-[#39ff14]/10 disabled:opacity-50"
      >
        {pending ? "[ WRITING... ]" : "[ UPDATE_RECORD ]"}
      </button>
    </form>
  );
}