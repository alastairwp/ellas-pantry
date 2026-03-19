import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** Check if Google auth is enabled via admin settings. Cached for 60s. */
let _googleAuthCache: { value: boolean; expires: number } | null = null;
export async function isGoogleAuthEnabled(): Promise<boolean> {
  if (_googleAuthCache && Date.now() < _googleAuthCache.expires) {
    return _googleAuthCache.value;
  }
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "google-auth-enabled" },
    });
    const enabled = setting?.value === "true";
    _googleAuthCache = { value: enabled, expires: Date.now() + 60_000 };
    return enabled;
  } catch {
    return false;
  }
}

const googleProvider = Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  allowDangerousEmailAccountLinking: true,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    googleProvider,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // Block Google sign-in when disabled in admin settings
      if (account?.provider === "google") {
        const enabled = await isGoogleAuthEnabled();
        if (!enabled) {
          console.log("[auth] Google sign-in blocked (disabled in settings)");
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      // On OAuth sign-in, fetch role from DB (OAuth user object won't have it)
      if (account && account.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { id: user?.id as string },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { image: true },
        });
        if (dbUser) session.user.image = dbUser.image;
      }
      return session;
    },
  },
});
