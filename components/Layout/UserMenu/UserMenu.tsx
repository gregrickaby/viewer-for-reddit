'use client'
import {logout} from '@/lib/actions/auth'
import {Anchor, Avatar, Button, Group} from '@mantine/core'
import {IconLogout} from '@tabler/icons-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isPending || isLoggingOut) return

    setIsLoggingOut(true)

    startTransition(async () => {
      try {
        const result = await logout()

        if (result.success) {
          router.push('/')
          router.refresh()
        }
      } finally {
        setIsLoggingOut(false)
      }
    })
  }

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
        <Anchor
          component={Link}
          href={`/u/${username}`}
          size="sm"
          c="dimmed"
          visibleFrom="sm"
          data-umami-event="nav-user-profile"
        >
          u/{username}
        </Anchor>
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
      component="a"
      href="/api/auth/login"
      aria-label="Login with Reddit"
      size="sm"
      data-umami-event="login-button"
    >
      Login
    </Button>
  )
}
