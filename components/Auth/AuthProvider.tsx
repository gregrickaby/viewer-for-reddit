'use client'

import {SessionProvider} from 'next-auth/react'
import type {Session} from 'next-auth'

interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

export function AuthProvider({children, session}: Readonly<AuthProviderProps>) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
