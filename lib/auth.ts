import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import prisma from "./prisma"
import logger from './logger'
import { verifyRecaptchaToken } from './recaptcha'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Пароль", type: "password" },
        recaptchaToken: { label: "reCAPTCHA Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        if (!credentials.recaptchaToken) {
          logger.warn('Login attempt failed: missing reCAPTCHA token')
          throw new Error('RECAPTCHA_REQUIRED')
        }

        const recaptchaResult = await verifyRecaptchaToken(credentials.recaptchaToken)

        if (!recaptchaResult.success) {
          logger.warn('Login attempt failed: invalid reCAPTCHA', recaptchaResult.error)
          throw new Error(recaptchaResult.error)
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            logger.warn('Login attempt failed: user not found')
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            logger.warn('Login attempt failed: invalid password')
            return null
          }

          logger.info('Successful login')

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          logger.error('Auth error', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 дней
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        session.user.email = token.email as string
        session.user.name = token.name as string
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/admin",
    error: "/admin"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getAuthSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireRole(role: 'SUPER_ADMIN' | 'EDITOR') {
  const session = await requireAuth()
  const userRole = (session.user as any).role
  
  if (role === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: SUPER_ADMIN role required')
  }
  
  if (role === 'EDITOR' && userRole !== 'SUPER_ADMIN' && userRole !== 'EDITOR') {
    throw new Error('Forbidden: EDITOR role required')
  }
  
  return session
}