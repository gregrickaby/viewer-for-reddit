'use client'

import {AppShell} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {Header} from '../Header/Header'
import {Sidebar} from '../Sidebar/Sidebar'

/**
 * Props for the AppLayout component.
 */
interface AppLayoutProps {
  /** Page content to render */
  children: React.ReactNode
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Username of the authenticated user */
  username?: string
  /** Avatar URL for the authenticated user */
  avatarUrl?: string
  /** User's subscribed subreddits */
  subscriptions?: Array<{
    name: string
    displayName: string
    icon?: string
  }>
  /** User's custom multireddits */
  multireddits?: Array<{
    name: string
    displayName: string
    path: string
  }>
}

/**
 * Main application layout wrapper using Mantine AppShell.
 * Provides consistent header, sidebar navigation, and content area.
 *
 * Features:
 * - Fixed header (60px height)
 * - Collapsible sidebar (300px width)
 * - Responsive behavior (mobile drawer, desktop sidebar)
 * - Desktop sidebar open by default
 * - Mobile sidebar closed by default
 *
 * @example
 * ```typescript
 * <AppLayout
 *   isAuthenticated={true}
 *   username="johndoe"
 *   subscriptions={subs}
 *   multireddits={multis}
 * >
 *   <PageContent />
 * </AppLayout>
 * ```
 */
export function AppLayout({
  children,
  isAuthenticated,
  username,
  avatarUrl,
  subscriptions,
  multireddits
}: Readonly<AppLayoutProps>) {
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
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
