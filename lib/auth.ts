import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
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
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      if (account?.provider === "google") {
        token.provider = "google"
        token.accessToken = account.access_token
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const supabase = getSupabaseClient()
          
          // Check if user exists
          const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("email", user.email!)
            .single()

          if (!fetchError && existingUser) {
            // User exists, update last login
            await supabase
              .from("users")
              .update({ last_login_at: new Date().toISOString() })
              .eq("id", existingUser.id)
            
            user.id = existingUser.id
            return true
          }

          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
              email: user.email,
              full_name: user.name,
              password_hash: "",
              provider: "google",
              oauth_id: (profile as any)?.sub || user.id,
            })
            .select()
            .single()

          if (createError) {
            console.error("[v0] Error creating Google user:", createError)
            return false
          }

          user.id = newUser.id
          return true
        } catch (error) {
          console.error("[v0] Google signIn callback error:", error)
          return false
        }
      }
      return true
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
