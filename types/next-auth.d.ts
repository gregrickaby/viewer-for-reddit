import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    scope?: string
    expiresAt?: number
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    scope?: string
    tokenError?: string
  }
}
