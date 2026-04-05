"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export type PlayerIndexRow = {
  id: string;
  ssn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  updatedAt: string;
};

export function PlayerIndexTable({ players }: { players: PlayerIndexRow[] }) {
  const router = useRouter();

  if (players.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={5} className="p-4 text-[#6fdc5c]/70">
            no records match query.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {players.map((p) => (
        <tr
          key={p.id}
          role="link"
          tabIndex={0}
          className="cursor-pointer border-b border-[#39ff14]/20 hover:bg-[#39ff14]/10 focus:bg-[#39ff14]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#39ff14]"
          onClick={() => router.push(`/players/${p.id}`)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push(`/players/${p.id}`);
            }
          }}
        >
          <td className="p-2 font-mono text-[#39ff14]">{p.ssn}</td>
          <td className="p-2">
            {p.lastName}, {p.firstName}
          </td>
          <td className="p-2 text-[#6fdc5c]/90">{p.dateOfBirth}</td>
          <td className="p-2 text-[#6fdc5c]/70">
            {p.updatedAt.slice(0, 16).replace("T", " ")}
          </td>
          <td className="p-2">
            <Link
              href={`/players/${p.id}?tab=overview`}
              className="text-xs text-[#39ff14] underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              [ EDIT ]
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
