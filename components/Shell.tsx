import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export function Shell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57,255,20,0.4) 2px, rgba(57,255,20,0.4) 3px)",
        }}
        aria-hidden
      />
      <header className="relative z-10 border-b border-aegis-lime/40 bg-black px-4 py-3 isolate">
        <div className="mx-auto max-w-6xl space-y-3">
          <div>
            <pre className="text-[10px] leading-tight text-aegis-dim sm:text-xs">
{`╔══════════════════════════════════════╗
║  AEGIS // CaliRP Intelligence Unit   ║
╚══════════════════════════════════════╝`}
            </pre>
            <p className="mt-1 font-mono text-xs text-aegis-dim">
              calirp://intel<span className="text-aegis-lime">$</span> session active
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-aegis-lime/25 pt-3 font-mono text-sm"
            aria-label="Main"
          >
            <Link
              href="/"
              className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
            >
              [ PLAYERS ]
            </Link>
            <Link
              href="/organizations"
              className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
            >
              [ ORGANIZATIONS ]
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/audit"
                  className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
                >
                  [ AUDIT_LOG ]
                </Link>
                <Link
                  href="/settings/blacklist"
                  className="text-aegis-lime underline-offset-4 hover:underline focus:outline focus:outline-2 focus:outline-aegis-lime"
                >
                  [ NAME_BLACKLIST ]
                </Link>
              </>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="relative z-10 isolate mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}