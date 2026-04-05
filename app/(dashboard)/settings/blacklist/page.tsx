import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  addNameBlacklistPhrase,
  deleteNameBlacklistPhrase,
} from "@/lib/actions/blacklist-admin";
import { prisma } from "@/lib/prisma";

export default async function BlacklistPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");
  const sp = await searchParams;
  const err =
    sp.e === "empty"
      ? "Phrase required."
      : sp.e === "dup"
        ? "Duplicate phrase (already on list)."
        : null;

  const entries = await prisma.nameBlacklist.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> name_blacklist
        </h1>
        <p className="mt-1 max-w-xl font-mono text-xs text-[#6fdc5c]/80">
          Substring match (case-insensitive) against player first/last name and
          organization name on create/update.
        </p>
        <Link href="/" className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline">
          &larr; [ INDEX ]
        </Link>
      </div>

      {err && (
        <pre className="max-w-xl border border-red-500/60 bg-black p-2 text-xs text-red-400">
          stderr: {err}
        </pre>
      )}

      <form
        action={addNameBlacklistPhrase}
        className="max-w-xl space-y-3 border border-[#39ff14]/50 p-4"
      >
        <div>
          <label className="text-xs text-[#6fdc5c]" htmlFor="phrase">
            Add phrase
          </label>
          <input
            id="phrase"
            name="phrase"
            required
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
            placeholder="blocked substring"
          />
        </div>
        <button
          type="submit"
          className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
        >
          [ COMMIT_ENTRY ]
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm text-[#6fdc5c]">&gt; entries</h2>
        {entries.length === 0 ? (
          <p className="font-mono text-xs text-[#6fdc5c]/70">[ EMPTY ]</p>
        ) : (
          <ul className="space-y-2 font-mono text-sm">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-[#39ff14]/30 px-3 py-2"
              >
                <span className="text-[#39ff14]">{e.phrase}</span>
                <form action={deleteNameBlacklistPhrase.bind(null, e.id)}>
                  <button
                    type="submit"
                    className="border border-red-500/60 px-2 py-0.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    [ REMOVE ]
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
