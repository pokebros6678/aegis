import Link from "next/link";
import { notFound } from "next/navigation";
import { createCasePost } from "@/lib/actions/cases";
import { CASE_CATEGORY_LABELS } from "@/lib/caseLabels";
import { formatPlayerLabel } from "@/lib/playerDisplay";
import { prisma } from "@/lib/prisma";

function authorLabel(author: {
  username: string;
  displayName: string | null;
} | null): string {
  if (!author) return "unknown";
  return author.displayName?.trim() || author.username;
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const caseRow = await prisma.case.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, discordUser: true, discordId: true } },
      organization: { select: { id: true, name: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        include: {
          authorUser: {
            select: { username: true, displayName: true },
          },
        },
      },
    },
  });

  if (!caseRow) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> case_file
        </h1>
        <p className="mt-1 font-mono text-sm">
          <span className="text-[#39ff14]">{caseRow.caseNumber}</span>
          <span className="text-[#6fdc5c]"> :: </span>
          <span className="text-[#6fdc5c]">
            {CASE_CATEGORY_LABELS[caseRow.category]}
          </span>
        </p>
        <p className="mt-1 text-base text-[#39ff14]">{caseRow.title}</p>
        <Link
          href="/cases"
          className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline"
        >
          &larr; [ CASE_INDEX ]
        </Link>
      </div>

      <section className="space-y-2 border border-[#39ff14]/40 p-4">
        <h2 className="text-sm text-[#6fdc5c]">&gt; links</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#6fdc5c]/70">User of interest</dt>
            <dd className="mt-0.5">
              {caseRow.player ? (
                <Link
                  href={`/players/${caseRow.player.id}?tab=overview`}
                  className="text-[#39ff14] hover:underline"
                >
                  {formatPlayerLabel(caseRow.player)}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#6fdc5c]/70">Group of interest</dt>
            <dd className="mt-0.5">
              {caseRow.organization ? (
                <Link
                  href={`/organizations/${caseRow.organization.id}?tab=overview`}
                  className="text-[#39ff14] hover:underline"
                >
                  {caseRow.organization.name}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2 border border-[#39ff14]/40 p-4">
        <h2 className="text-sm text-[#6fdc5c]">&gt; initial_case_data</h2>
        <pre className="whitespace-pre-wrap font-mono text-sm text-[#39ff14]/95">
          {caseRow.body}
        </pre>
        <p className="text-xs text-[#6fdc5c]/60">
          filed {caseRow.createdAt.toISOString().slice(0, 16).replace("T", " ")}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm text-[#6fdc5c]">&gt; thread</h2>
        {caseRow.posts.length === 0 ? (
          <p className="text-sm text-[#6fdc5c]/70">no replies yet.</p>
        ) : (
          <ul className="space-y-3">
            {caseRow.posts.map((post) => (
              <li
                key={post.id}
                className="border border-[#39ff14]/30 bg-black/40 p-3"
              >
                <p className="text-xs text-[#6fdc5c]">
                  {authorLabel(post.authorUser)}{" "}
                  <span className="text-[#39ff14]/50">::</span>{" "}
                  {post.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-[#39ff14]/95">
                  {post.body}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-[#39ff14]/50 p-4">
        <h2 className="mb-3 text-sm text-[#6fdc5c]">&gt; post_reply</h2>
        <form action={createCasePost} className="space-y-3">
          <input type="hidden" name="caseId" value={caseRow.id} />
          <div>
            <label className="block text-xs text-[#6fdc5c]" htmlFor="reply-body">
              Reply
            </label>
            <textarea
              id="reply-body"
              name="body"
              required
              rows={5}
              className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
            />
          </div>
          <button
            type="submit"
            className="border border-[#39ff14] px-4 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
          >
            [ POST_REPLY ]
          </button>
        </form>
      </section>
    </div>
  );
}
