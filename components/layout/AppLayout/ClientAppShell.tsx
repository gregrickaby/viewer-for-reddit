'use client'

import {AppShell} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {Header} from '../Header/Header'
import {Sidebar} from '../Sidebar/Sidebar'

interface ClientAppShellProps {
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

export function ClientAppShell({
  children,
  isAuthenticated,
  username,
  avatarUrl,
  subscriptions,
  multireddits,
  following
}: Readonly<ClientAppShellProps>) {
  const [mobileOpened, {toggle: toggleMobile}] = useDisclosure()
  const [desktopOpened, {toggle: toggleDesktop}] = useDisclosure(true)

  return (
    <AppShell
      header={{height: 60}}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: {mobile: !mobileOpened, desktop: !desktopOpened}
      }}
      padding="md"
    >
      <AppShell.Header>
        <Header
          isAuthenticated={isAuthenticated}
          username={username}
          avatarUrl={avatarUrl}
          mobileOpened={mobileOpened}
          onToggleMobile={toggleMobile}
          onToggleDesktop={toggleDesktop}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar
          isAuthenticated={isAuthenticated}
          username={username}
          subscriptions={subscriptions}
          multireddits={multireddits}
          following={following}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
