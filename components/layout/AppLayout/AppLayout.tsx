import {ClientAppShell} from './ClientAppShell'

interface AppLayoutProps {
  children: React.ReactNode
  isAuthenticated?: boolean
  username?: string
  avatarUrl?: string
  subscriptions?: Array<{
    name: string
    displayName: string
    icon?: string
  }>
  multireddits?: Array<{
    name: string
    displayName: string
    path: string
    subreddits: string[]
    icon?: string
  }>
  following?: Array<{
    name: string
    id: string
    date: number
    note?: string
  }>
}

export function AppLayout({
  children,
  isAuthenticated,
  username,
  avatarUrl,
  subscriptions,
  multireddits,
  following
}: Readonly<AppLayoutProps>) {
  return (
    <ClientAppShell
      isAuthenticated={isAuthenticated}
      username={username}
      avatarUrl={avatarUrl}
      subscriptions={subscriptions}
      multireddits={multireddits}
      following={following}
    >
      {children}
    </ClientAppShell>
  )
}
