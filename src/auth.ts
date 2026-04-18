import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByEmail } from "@/lib/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      vid: string;
      email: string;
      name: string;
      image?: string;
      coupleId?: string;
      code?: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      if (!user?.email || !user?.name) return false;
      await upsertUser({
        email: user.email,
        name: user.name,
        image: user.image ?? undefined,
      });
      return true;
    },
    async jwt({ token }) {
      if (!token.email) return token;
      const u = await getUserByEmail(token.email);
      if (u) {
        token.vid = u.id;
        token.code = u.code;
        token.coupleId = u.coupleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.vid && session.user) {
        session.user.vid = token.vid as string;
        session.user.id = token.vid as string;
        session.user.code = token.code as string | undefined;
        session.user.coupleId = token.coupleId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
