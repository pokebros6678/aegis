import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { normalizeUsername, verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "Staff",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const usernameRaw = credentials?.username;
        const password = credentials?.password as string | undefined;
        if (
          usernameRaw == null ||
          typeof usernameRaw !== "string" ||
          password == null
        ) {
          return null;
        }
        const username = normalizeUsername(usernameRaw);
        if (!username) return null;

        const user = await prisma.staffUser.findUnique({
          where: { username },
        });
        if (!user || user.disabled) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.displayName?.trim() || user.username,
          role: user.role === "ADMIN" ? "admin" : "member",
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
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      const r = token.role;
      session.user.role =
        r === "admin" || r === "member" ? r : "member";
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
