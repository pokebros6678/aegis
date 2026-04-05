import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

function resolveStaffRole(password: string): "admin" | "member" | null {
  const adminPw = process.env.AEGIS_ADMIN_PASSWORD;
  const memberPw = process.env.AEGIS_MEMBER_PASSWORD;
  const legacyPw = process.env.AEGIS_STAFF_PASSWORD;

  if (adminPw && password === adminPw) return "admin";
  if (!adminPw && legacyPw && password === legacyPw) return "admin";
  if (memberPw && password === memberPw) return "member";
  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "Staff",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const password = credentials?.password as string | undefined;
        if (password == null) return null;
        const role = resolveStaffRole(password);
        if (!role) return null;
        return {
          id: role === "admin" ? "staff-admin" : "staff-member",
          name: role === "admin" ? "AEGIS Admin" : "AEGIS Member",
          role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  callbacks: {
    jwt({ token, user }) {
      if (user?.role) token.role = user.role;
      return token;
    },
    session({ session, token }) {
      const r = token.role;
      session.user.role =
        r === "admin" || r === "member" ? r : "member";
      return session;
    },
  },
});
