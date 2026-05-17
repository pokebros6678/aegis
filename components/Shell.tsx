import { ShellNav } from "@/components/ShellNav";
import { SESSION_URI, SHELL_ASCII_BANNER } from "@/lib/branding";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, color-mix(in srgb, var(--aegis-accent) 40%, transparent) 2px, color-mix(in srgb, var(--aegis-accent) 40%, transparent) 3px)",
        }}
        aria-hidden
      />
      <header className="relative z-10 border-b border-aegis-lime/40 bg-aegis-bg px-4 py-4 isolate">
        <div className="mx-auto max-w-6xl space-y-3">
          <div>
            <pre className="text-[10px] leading-tight text-aegis-dim sm:text-xs">
{SHELL_ASCII_BANNER}
            </pre>
            <p className="mt-1 font-mono text-xs text-aegis-dim">
              {SESSION_URI}
              <span className="text-aegis-lime">$</span> session active
            </p>
          </div>
          <ShellNav />
        </div>
      </header>
      <main className="relative z-10 isolate mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}