import {MobileSearch} from '@/components/layout/Header/MobileSearch'
import {Logo} from '@/components/layout/Logo/Logo'
import {SidebarToggle} from '@/components/layout/Sidebar/SidebarToggle'
import {UserMenu} from '@/components/layout/UserMenu/UserMenu'
import {ThemeToggle} from '@/components/ui/ThemeToggle/ThemeToggle'
import {Group} from '@mantine/core'

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /** Username of the authenticated user */
  username?: string
  /** Avatar URL for the authenticated user */
  avatarUrl?: string
}

/** Application header with navigation and search. Displays logo, navigation toggles, user menu, and (once signed in) search, since Reddit's API requires an authenticated user context. */
export function Header({username, avatarUrl}: Readonly<HeaderProps>) {
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
        {username && <MobileSearch />}

        <ThemeToggle />

        <UserMenu username={username} avatarUrl={avatarUrl} />
      </Group>
    </Group>
  )
}
