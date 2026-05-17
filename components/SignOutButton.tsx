"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="border border-aegis-lime/60 px-3 py-1 text-sm text-aegis-lime hover:bg-aegis-lime/10 hover:ring-2 hover:ring-aegis-lime/30 focus:outline focus:outline-2 focus:outline-aegis-lime"
    >
      [ sign_out ]
    </button>
  );
}