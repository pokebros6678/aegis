"use client";

import { useActionState } from "react";
import {
  updateOrganizationAction,
  type OrgFormState,
} from "@/lib/actions/organizations";
import { ORGANIZATION_TYPE_LABELS } from "@/lib/organizationLabels";
import { organizationTypeValues } from "@/lib/validations";
import type { OrganizationType } from "@prisma/client";

type Org = {
  id: string;
  name: string;
  type: OrganizationType;
  notes: string | null;
};

export function OrganizationOverviewForm({ organization }: { organization: Org }) {
  const [state, formAction, pending] = useActionState<OrgFormState, FormData>(
    updateOrganizationAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4 border border-[#39ff14]/50 p-4">
      <input type="hidden" name="organizationId" value={organization.id} />
      {state != null && "error" in state && state.error?._form && (
        <pre className="whitespace-pre-wrap border border-red-500/60 bg-black p-2 text-xs text-red-400">
          stderr: {state.error._form.join("\n")}
        </pre>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs text-[#6fdc5c]" htmlFor="org-name">
            Name
          </label>
          <input
            id="org-name"
            name="name"
            required
            defaultValue={organization.name}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
          {state != null && "error" in state && state.error?.name && (
            <p className="mt-1 text-xs text-red-400">{state.error.name[0]}</p>
          )}
        </div>
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="org-type">
            Type
          </label>
          <select
            id="org-type"
            name="type"
            required
            defaultValue={organization.type}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          >
            {organizationTypeValues.map((v) => (
              <option key={v} value={v}>
                {ORGANIZATION_TYPE_LABELS[v]}
              </option>
            ))}
          </select>
          {state != null && "error" in state && state.error?.type && (
            <p className="mt-1 text-xs text-red-400">{state.error.type[0]}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-[#6fdc5c]" htmlFor="org-notes">
            Notes
          </label>
          <textarea
            id="org-notes"
            name="notes"
            rows={4}
            defaultValue={organization.notes ?? ""}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10 disabled:opacity-50"
      >
        [ COMMIT_CHANGES ]
      </button>
    </form>
  );
}
