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
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Username of the authenticated user */
  username?: string
  /** Avatar URL for the authenticated user */
  avatarUrl?: string
}

/** Application header with navigation and search. Displays logo, navigation toggles, search bar, and user menu. */
export function Header({
  isAuthenticated,
  username,
  avatarUrl
}: Readonly<HeaderProps>) {
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
        <MobileSearch />

        <ThemeToggle />

        <UserMenu
          isAuthenticated={isAuthenticated}
          username={username}
          avatarUrl={avatarUrl}
        />
      </Group>
    </Group>
  )
}
