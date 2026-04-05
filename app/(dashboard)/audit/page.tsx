import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> audit_log
        </h1>
        <p className="mt-1 font-mono text-xs text-[#6fdc5c]/80">
          Last 200 mutation events (role tier only; no per-user identity).
        </p>
        <Link href="/" className="mt-2 inline-block text-xs text-[#6fdc5c] hover:underline">
          &larr; [ INDEX ]
        </Link>
      </div>

      <div className="overflow-x-auto border border-[#39ff14]/40">
        <table className="w-full min-w-[640px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-[#39ff14]/40 text-left text-[#6fdc5c]">
              <th className="p-2">time_utc</th>
              <th className="p-2">action</th>
              <th className="p-2">entity</th>
              <th className="p-2">id</th>
              <th className="p-2">actor</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[#6fdc5c]/70">
                  [ NO_ENTRIES ]
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#39ff14]/20 text-[#39ff14]"
                >
                  <td className="p-2 whitespace-nowrap text-[#6fdc5c]/90">
                    {r.createdAt.toISOString()}
                  </td>
                  <td className="p-2">{r.action}</td>
                  <td className="p-2">{r.entityType}</td>
                  <td className="p-2 break-all">{r.entityId}</td>
                  <td className="p-2">{r.actorRole}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
