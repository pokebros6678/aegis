import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createStaffUser,
  deleteStaffUser,
  setStaffUserPassword,
  toggleStaffUserDisabled,
  updateStaffUser,
} from "@/lib/actions/staff-users";
import { prisma } from "@/lib/prisma";
import { staffRoleValues } from "@/lib/validations";

export default async function StaffUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");
  const sp = await searchParams;
  const err =
    sp.e === "validation"
      ? "Check fields (username rules, password length 8+, match confirm)."
      : sp.e === "dup"
        ? "Username already taken."
        : sp.e === "lastadmin"
          ? "Cannot remove or demote the last active admin."
          : sp.e === "self"
            ? "You cannot disable or delete your own account here."
            : sp.e === "missing"
              ? "User not found."
              : null;

  const users = await prisma.staffUser.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg">
          <span className="text-[#6fdc5c]">aegis&gt;</span> staff_users
        </h1>
        <p className="mt-1 max-w-xl font-mono text-xs text-[#6fdc5c]/80">
          Create accounts, roles, and password resets. Usernames are stored
          lowercase; passwords are hashed (bcrypt).
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

      <section className="space-y-3">
        <h2 className="text-sm text-[#6fdc5c]">&gt; new_user</h2>
        <form
          action={createStaffUser}
          className="max-w-xl space-y-3 border border-[#39ff14]/50 p-4 font-mono text-xs"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[#6fdc5c]" htmlFor="nu-username">
                username
              </label>
              <input
                id="nu-username"
                name="username"
                required
                autoComplete="off"
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              />
            </div>
            <div>
              <label className="text-[#6fdc5c]" htmlFor="nu-role">
                role
              </label>
              <select
                id="nu-role"
                name="role"
                required
                className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
              >
                {staffRoleValues.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[#6fdc5c]" htmlFor="nu-display">
              display_name (optional)
            </label>
            <input
              id="nu-display"
              name="displayName"
              className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
            />
          </div>
          <div>
            <label className="text-[#6fdc5c]" htmlFor="nu-password">
              password
            </label>
            <input
              id="nu-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
            />
          </div>
          <button
            type="submit"
            className="border border-[#39ff14] px-3 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
          >
            [ CREATE_USER ]
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm text-[#6fdc5c]">&gt; accounts</h2>
        <ul className="space-y-6">
          {users.map((u) => (
            <li
              key={u.id}
              className="border border-[#39ff14]/40 p-4 font-mono text-xs"
            >
              <div className="mb-3 flex flex-wrap items-baseline gap-2 text-[#39ff14]">
                <span className="text-sm">{u.username}</span>
                <span className="text-[#6fdc5c]">({u.role})</span>
                {u.disabled && (
                  <span className="text-red-400">[ DISABLED ]</span>
                )}
                {u.id === session.user.id && (
                  <span className="text-[#6fdc5c]">[ YOU ]</span>
                )}
              </div>

              <form action={updateStaffUser} className="mb-3 space-y-2">
                <input type="hidden" name="userId" value={u.id} />
                <div className="flex flex-wrap gap-2">
                  <input
                    name="displayName"
                    defaultValue={u.displayName ?? ""}
                    placeholder="display name"
                    className="min-w-[12rem] flex-1 border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                  <select
                    name="role"
                    defaultValue={u.role}
                    className="border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  >
                    {staffRoleValues.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="border border-[#39ff14] px-2 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    [ SAVE_PROFILE ]
                  </button>
                </div>
              </form>

              <form action={setStaffUserPassword} className="mb-3 space-y-2">
                <input type="hidden" name="userId" value={u.id} />
                <span className="text-[#6fdc5c]">reset_password</span>
                <div className="flex flex-wrap gap-2">
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="new password"
                    autoComplete="new-password"
                    className="min-w-[10rem] border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                  <input
                    name="passwordConfirm"
                    type="password"
                    minLength={8}
                    placeholder="confirm"
                    autoComplete="new-password"
                    className="min-w-[10rem] border border-[#39ff14]/60 bg-black px-2 py-1 text-[#39ff14]"
                  />
                  <button
                    type="submit"
                    className="border border-[#39ff14] px-2 py-1 text-[#39ff14] hover:bg-[#39ff14]/10"
                  >
                    [ SET_PASSWORD ]
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                <form action={toggleStaffUserDisabled.bind(null, u.id)}>
                  <button
                    type="submit"
                    className="border border-amber-500/60 px-2 py-1 text-amber-400 hover:bg-amber-500/10"
                  >
                    {u.disabled ? "[ ENABLE ]" : "[ DISABLE ]"}
                  </button>
                </form>
                <form action={deleteStaffUser.bind(null, u.id)}>
                  <button
                    type="submit"
                    className="border border-red-500/60 px-2 py-1 text-red-400 hover:bg-red-500/10"
                  >
                    [ DELETE ]
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        {users.length === 0 && (
          <p className="font-mono text-xs text-[#6fdc5c]/70">
            [ NO_USERS ] Run{" "}
            <code className="text-[#39ff14]">npm run create-admin</code> on the
            server once.
          </p>
        )}
      </section>
    </div>
  );
}
