"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { NAV_GROUPS_OF_INTEREST, NAV_USERS_OF_INTEREST } from "@/lib/branding";

const linkBase =
  "font-mono text-sm underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`${linkBase} ${active ? "text-aegis-lime-dim" : "text-aegis-lime"}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function ShellNav() {
  return (
    <nav
      className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-aegis-lime/25 pt-3"
      aria-label="Main"
    >
      <NavLink href="/">{NAV_USERS_OF_INTEREST}</NavLink>
      <NavLink href="/organizations">{NAV_GROUPS_OF_INTEREST}</NavLink>
      <NavLink href="/settings">[ SETTINGS ]</NavLink>
      <SignOutButton />
    </nav>
  );
}
