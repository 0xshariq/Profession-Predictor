import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import { dbConnect, dbDisconnect } from "@/lib/dbConnect"
import UserModel from "@/models/User.models"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined): Promise<{ id: string; email: string; username: string; isVerified: boolean } | null> {
        if (!credentials) {
          throw new Error("Credentials are required")
        }
        await dbConnect()
        try {
          // Find user by email or username
          const user = (await UserModel.findOne({
            $or: [{ email: credentials.email }, { username: credentials.email }],
          })) as { _id: string; email: string; username: string; password: string; isVerified: boolean } | null
          if (!user) throw new Error("User not found")
          if (!user.isVerified) throw new Error("User not verified")

          // Compare provided password with stored hashed password
          const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordCorrect) {
            throw new Error("Password incorrect")
          }

          // Return user with id property (mapped from _id) to match NextAuth User type
          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            throw new Error(error.message)
          }
          throw new Error("An unknown error occurred")
        } finally {
          // Always disconnect from the database
          await dbDisconnect()
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  // Custom sign-in page
  pages: {
    signIn: "/signIn",
    error: "/signIn", // Error page for authentication issues
  },
  // Use JWT for session handling
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Callback to customize session object
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.isVerified = token.isVerified
        session.user.username = token.username
      }
      return session
    },
    // Callback to customize JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isVerified = user.isVerified
        token.username = user.username
      }
      return token
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        await dbConnect()
        try {
          const userEmail = profile?.email
          if (!userEmail) {
            return false
          }

          const user = await UserModel.findOne({ email: userEmail })
          if (!user) {
            // Create a new user if they don't exist
            const username = profile?.name ? profile.name.replace(/\s+/g, "").toLowerCase() : `user_${Date.now()}`

            await UserModel.create({
              email: userEmail,
              username: username,
              isVerified: true, // Automatically verify users from OAuth providers
              password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
            })
          }
          return true
        } catch (error) {
          console.error("Error during OAuth sign in:", error)
          return false
        } finally {
          await dbDisconnect()
        }
      }
      return true
    },
  },
  debug: process.env.NODE_ENV === "development",
}
