import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
  throw new Error('NEXTAUTH_SECRET is missing or too short (minimum 32 characters)')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions['adapter'],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const ip = (req.headers?.['x-forwarded-for'] as string)?.split(',')[0].trim()
          ?? (req.headers?.['x-real-ip'] as string)
          ?? 'unknown'
        const rl = await rateLimit({ key: `rate:login:${ip}`, limit: 10, windowSec: 900 })
        if (!rl.allowed) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            specialization: true,
            avatarUrl: true,
          },
        })

        if (!user?.passwordHash) return null

        const valid = await compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          specialization: user.specialization,
          avatarUrl: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.specialization = (user as { specialization?: string }).specialization
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.specialization = token.specialization as string | undefined
        session.user.avatarUrl = token.avatarUrl as string | undefined
      }
      return session
    },
  },
}
