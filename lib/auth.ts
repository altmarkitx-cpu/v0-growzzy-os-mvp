import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// Ensure NEXTAUTH_SECRET is always set
const getSecret = (): string => {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET
  }
  return "build-time-fallback-secret-do-not-use-in-production-" + (process.env.NODE_ENV || "unknown")
}

// Create Supabase client lazily
const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const supabase = getSupabaseClient()
          const { data: users, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .single()

          if (error || !users) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            users.password_hash || ""
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: users.id,
            email: users.email,
            name: users.full_name,
          }
        } catch (error) {
          console.error("[v0] Auth authorize error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: getSecret(),
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export const { GET, POST } = handler
export const auth = handler
