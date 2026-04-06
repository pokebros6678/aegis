"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("access_denied: invalid credentials");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <pre className="mb-6 text-center text-[10px] text-[#6fdc5c] sm:text-xs">
{`╔══════════════════════════════════════╗
║       AEGIS — CaliRP // LOGIN        ║
╚══════════════════════════════════════╝`}
      </pre>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border border-[#39ff14]/50 bg-black p-6"
      >
        <p className="text-sm text-[#6fdc5c]">
          <span className="text-[#39ff14]">calirp://</span>aegis auth required
        </p>
        <div>
          <label htmlFor="username" className="text-xs text-[#6fdc5c]">
            username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-2 text-[#39ff14]"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs text-[#6fdc5c]">
            password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-2 text-[#39ff14]"
          />
        </div>
        {error && (
          <pre className="text-xs text-red-400">{error}</pre>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[#39ff14] py-2 text-[#39ff14] hover:bg-[#39ff14]/10 disabled:opacity-50"
        >
          {busy ? "[ AUTHENTICATING... ]" : "[ ENTER ]"}
        </button>
      </form>
    </div>
  );
}
