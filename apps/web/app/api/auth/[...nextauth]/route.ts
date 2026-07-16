// Drop-in replacement: swap credentials for OAuth provider or change JWT_SECRET here
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
          if (!res.ok) return null
          const data = await res.json() as { id: string; email: string; token: string }
          return { id: data.id, email: data.email, apiToken: data.token }
        } catch {
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.apiToken = (user as { apiToken?: string }).apiToken
      return token
    },
    async session({ session, token }) {
      ;(session as { apiToken?: string }).apiToken = token.apiToken as string | undefined
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
})

export { handler as GET, handler as POST }
