import {isAuthenticated} from '@/lib/auth/session'
import {redirect} from 'next/navigation'

/**
 * Layout-level auth gate for routes that require a Reddit session.
 * Second line of defense alongside proxy.ts middleware.
 *
 * Applied to: /r/[subreddit], /u/[username], /search/[query],
 * /user/[username]/saved, /user/[username]/m/[multiname]
 */
export default async function ProtectedLayout({
  children
}: Readonly<{children: React.ReactNode}>) {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    redirect('/')
  }

  return children
}
