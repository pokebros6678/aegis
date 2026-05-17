import Link from "next/link";
import { auth } from "@/auth";
import { SettingsAppearance } from "@/components/settings/SettingsAppearance";

export default async function SettingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-normal tracking-wide">
          <span className="text-aegis-lime-dim">aegis&gt;</span> settings
        </h1>
        <p className="mt-1 text-sm text-aegis-lime-dim/90">
          Appearance for your session; administration tools for admins.
        </p>
      </div>

      <SettingsAppearance />

      {isAdmin && (
        <section className="space-y-3 border border-aegis-lime/40 bg-black/40 p-4">
          <h2 className="border-b border-aegis-lime/30 pb-2 font-mono text-sm text-aegis-lime-dim">
            &gt; administration
          </h2>
          <ul className="flex flex-col gap-2 font-mono text-sm">
            <li>
              <Link
                href="/audit"
                className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
              >
                [ AUDIT_LOG ]
              </Link>
            </li>
            <li>
              <Link
                href="/settings/blacklist"
                className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
              >
                [ NAME_BLACKLIST ]
              </Link>
            </li>
            <li>
              <Link
                href="/settings/users"
                className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
              >
                [ USERS ]
              </Link>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
