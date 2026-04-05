import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
        const expected = process.env.AEGIS_STAFF_PASSWORD;
        if (!expected || password == null || password !== expected) return null;
        return { id: "staff", name: "AEGIS Staff" };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
});