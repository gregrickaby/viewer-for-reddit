'use client'

import {SearchBar} from '@/components/ui/SearchBar/SearchBar'
import {
  ActionIcon,
  Box,
  Burger,
  Group,
  useComputedColorScheme,
  useMantineColorScheme
} from '@mantine/core'
import {IconMoon, IconSearch, IconSun} from '@tabler/icons-react'
import {useState} from 'react'
import {Logo} from '../Logo/Logo'
import {UserMenu} from '../UserMenu/UserMenu'

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
  /** Whether the mobile navigation drawer is open */
  mobileOpened?: boolean
  /** Callback to toggle mobile navigation drawer */
  onToggleMobile?: () => void
  /** Callback to toggle desktop navigation sidebar */
  onToggleDesktop?: () => void
}

/**
 * Application header with navigation and search.
 * Displays logo, navigation toggles, search bar, and user menu.
 *
 * Features:
 * - Responsive layout (different burger menus for mobile/desktop)
 * - Mobile search overlay
 * - Logo linking to home
 * - User authentication state
 *
 * @example
 * ```typescript
 * <Header
 *   isAuthenticated={true}
 *   username="johndoe"
 *   onToggleMobile={handleToggleMobile}
 *   onToggleDesktop={handleToggleDesktop}
 * />
 * ```
 */
export function Header({
  isAuthenticated,
  username,
  avatarUrl,
  mobileOpened,
  onToggleMobile,
  onToggleDesktop
}: Readonly<HeaderProps>) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const {setColorScheme} = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true
  })

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Group
      h="100%"
      px={{base: 'sm', sm: 'md'}}
      justify="space-between"
      gap="xs"
    >
      <Group gap="xs">
        <Burger
          opened={mobileOpened}
          onClick={onToggleMobile}
          hiddenFrom="sm"
          size="sm"
          aria-label="Toggle mobile navigation"
          data-umami-event="toggle-mobile-nav"
        />
        <Burger
          opened={false}
          onClick={onToggleDesktop}
          visibleFrom="sm"
          size="sm"
          aria-label="Toggle desktop navigation"
          data-umami-event="toggle-desktop-nav"
        />
        <Logo />
      </Group>

      <Group gap="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          hiddenFrom="sm"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
          data-umami-event="open-mobile-search"
        >
          <IconSearch aria-hidden="true" size={20} />
        </ActionIcon>

        <Box visibleFrom="sm">
          <SearchBar
            mobileOpen={mobileSearchOpen}
            onMobileClose={() => setMobileSearchOpen(false)}
          />
        </Box>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={toggleColorScheme}
          aria-label={
            computedColorScheme === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
          data-umami-event="toggle-color-scheme"
        >
          {computedColorScheme === 'dark' ? (
            <IconSun aria-hidden="true" size={20} />
          ) : (
            <IconMoon aria-hidden="true" size={20} />
          )}
        </ActionIcon>

        <UserMenu
          isAuthenticated={isAuthenticated}
          username={username}
          avatarUrl={avatarUrl}
        />
      </Group>
    </Group>
  )
}
