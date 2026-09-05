import type { NextAuthConfig } from 'next-auth';

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

if (process.env.NODE_ENV === "production" && !authSecret) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET must be configured in production.")
}

// In production we require a real secret. In development we fall back to a
// stable string so the app boots without env vars; the throw above prevents
// the production path from ever using the fallback.
const resolvedSecret = authSecret || (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("AUTH_SECRET missing in production") })()
    : "development-only-secret-do-not-deploy")

export const authConfig = {
    session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
    jwt: { maxAge: 7 * 24 * 60 * 60 },
    pages: {
        signIn: '/auth',
    },
    trustHost: true,
    secret: resolvedSecret,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },
    providers: [], // To be populated in auth.ts
} satisfies NextAuthConfig;
