import {MobileSearch} from '@/components/layout/Header/MobileSearch'
import {Logo} from '@/components/layout/Logo/Logo'
import {SidebarToggle} from '@/components/layout/Sidebar/SidebarToggle'
import {UserMenu} from '@/components/layout/UserMenu/UserMenu'
import {ThemeToggle} from '@/components/ui/ThemeToggle/ThemeToggle'
import {getCurrentUserAvatar} from '@/lib/actions/reddit/users'
import {getSession, isAuthenticated} from '@/lib/auth/session'
import {Group, Skeleton} from '@mantine/core'
import {Suspense} from 'react'

/**
 * Application header with navigation and search. Displays logo, navigation
 * toggles, user menu, and (once signed in) search, since Reddit's API
 * requires an authenticated user context.
 *
 * Resolves its own auth state (via Suspense-wrapped children) rather than
 * taking it as props, so the static chrome (logo, toggles) never blocks on
 * the session cookie read.
 */
export function Header() {
  return (
    <Group
      h="100%"
      px={{base: 'sm', sm: 'md'}}
      justify="space-between"
      gap="xs"
    >
      <Group gap="xs">
        <SidebarToggle />
        <Logo />
      </Group>

      <Group gap="xs">
        <Suspense fallback={null}>
          <HeaderMobileSearch />
        </Suspense>

        <ThemeToggle />

        <Suspense fallback={<Skeleton height={32} width={32} circle />}>
          <HeaderUserMenu />
        </Suspense>
      </Group>
    </Group>
  )
}

export async function HeaderMobileSearch() {
  const authenticated = await isAuthenticated()
  return authenticated ? <MobileSearch /> : null
}

export async function HeaderUserMenu() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return <UserMenu />
  }

  const session = await getSession()
  const avatarUrl = await getCurrentUserAvatar()

  return (
    <UserMenu username={session.username} avatarUrl={avatarUrl ?? undefined} />
  )
}
