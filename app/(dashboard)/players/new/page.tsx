import Link from "next/link";
import { createPlayer } from "@/lib/actions/intel";

export default function NewPlayerPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> new_player_record
        </h1>
        <Link href="/" className="mt-2 inline-block text-sm text-[#6fdc5c] hover:underline">
          &larr; [ BACK_TO_INDEX ]
        </Link>
      </div>

      <form action={createPlayer} className="space-y-4 border border-[#39ff14]/50 p-4">
        <Field label="SSN" name="ssn" required />
        <Field label="First name" name="firstName" required />
        <Field label="Last name" name="lastName" required />
        <div>
          <label className="block text-xs text-[#6fdc5c]">Date of birth</label>
          <input
            name="dateOfBirth"
            type="date"
            required
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
          />
        </div>
        <button
          type="submit"
          className="border border-[#39ff14] px-4 py-2 text-[#39ff14] hover:bg-[#39ff14]/10"
        >
          [ COMMIT_RECORD ]
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