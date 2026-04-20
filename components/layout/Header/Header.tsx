import {SearchBar} from '@/components/ui/SearchBar/SearchBar'
import {ThemeToggle} from '@/components/ui/ThemeToggle/ThemeToggle'
import {ActionIcon, Box, Group} from '@mantine/core'
import {IconSearch} from '@tabler/icons-react'
import {Logo} from '@/components/layout/Logo/Logo'
import {SidebarToggle} from '@/components/layout/Sidebar/SidebarToggle'
import {UserMenu} from '@/components/layout/UserMenu/UserMenu'

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
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          hiddenFrom="sm"
          data-umami-event="open-mobile-search"
        >
          <IconSearch aria-hidden="true" size={20} />
        </ActionIcon>

        <Box visibleFrom="sm">
          <SearchBar />
        </Box>

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
