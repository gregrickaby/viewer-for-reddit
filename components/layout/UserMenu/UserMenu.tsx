'use client'
import {useLogout} from '@/lib/hooks'
import {Anchor, Avatar, Button, Group} from '@mantine/core'
import {IconBrandReddit, IconLogout} from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Props for the UserMenu component.
 */
interface UserMenuProps {
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Username of the authenticated user */
  username?: string
  /** Avatar URL for the authenticated user */
  avatarUrl?: string
}

/**
 * User menu displaying authentication state and actions.
 * Shows username link and logout button when authenticated,
 * or login button when not authenticated.
 *
 * Features:
 * - Link to user profile (authenticated)
 * - Logout button with loading state
 * - Login button (unauthenticated)
 * - Race condition prevention
 * - Responsive layout (text hidden on mobile)
 *
 * @example
 * ```typescript
 * <UserMenu
 *   isAuthenticated={true}
 *   username="johndoe"
 * />
 * ```
 */
export function UserMenu({
  isAuthenticated,
  username,
  avatarUrl
}: Readonly<UserMenuProps>) {
  const {isLoggingOut, handleLogout} = useLogout()

  if (isAuthenticated) {
    return (
      <Group gap="xs" wrap="nowrap">
        {avatarUrl && (
          <Anchor
            component={Link}
            href={`/u/${username}`}
            aria-label={`Go to ${username}'s profile`}
            data-umami-event="nav-user-avatar"
          >
            <Avatar
              src={avatarUrl}
              alt={`${username}'s avatar`}
              size="sm"
              radius="xl"
            />
          </Anchor>
        )}
        <Button
          variant="subtle"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          loading={isLoggingOut}
          aria-label="Logout"
          hiddenFrom="sm"
          px="xs"
          size="sm"
          data-umami-event="logout-button"
        />
        <Button
          variant="subtle"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          loading={isLoggingOut}
          aria-label="Logout"
          visibleFrom="sm"
          size="sm"
          data-umami-event="logout-button"
        >
          Logout
        </Button>
      </Group>
    )
  }

  return (
    <Button
      aria-label="Sign in with Reddit"
      component="a"
      data-umami-event="login-button"
      href="/api/auth/login"
      leftSection={<IconBrandReddit size={16} />}
      size="sm"
    >
      Sign in with Reddit
    </Button>
  )
}
