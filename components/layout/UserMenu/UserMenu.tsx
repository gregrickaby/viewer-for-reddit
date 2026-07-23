'use client'

import {useLogout} from '@/lib/hooks/useLogout'
import {Anchor, Avatar, Button, Group} from '@mantine/core'
import {IconLogin, IconLogout} from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Props for the UserMenu component.
 */
interface UserMenuProps {
  /** Username of the authenticated user */
  username?: string
  /** Avatar URL for the authenticated user */
  avatarUrl?: string
}

/**
 * User menu displaying authentication state and actions.
 * Shows login button when unauthenticated, avatar + logout when authenticated.
 */
export function UserMenu({username, avatarUrl}: Readonly<UserMenuProps>) {
  const {isLoggingOut, handleLogout} = useLogout()

  if (!username) {
    return (
      <Group gap="xs" wrap="nowrap">
        <Button
          component="a"
          href="/api/auth/login"
          rel="nofollow"
          variant="subtle"
          leftSection={<IconLogin size={16} />}
          aria-label="Login"
          hiddenFrom="sm"
          px="xs"
          size="sm"
        />
        <Button
          component="a"
          href="/api/auth/login"
          rel="nofollow"
          variant="subtle"
          leftSection={<IconLogin size={16} />}
          aria-label="Login"
          visibleFrom="sm"
          size="sm"
        >
          Login
        </Button>
      </Group>
    )
  }

  return (
    <Group gap="xs" wrap="nowrap">
      {avatarUrl && (
        <Anchor
          component={Link}
          href={`/u/${username}`}
          aria-label={`Go to ${username}'s profile`}
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
      />
      <Button
        variant="subtle"
        leftSection={<IconLogout size={16} />}
        onClick={handleLogout}
        loading={isLoggingOut}
        aria-label="Logout"
        visibleFrom="sm"
        size="sm"
      >
        Logout
      </Button>
    </Group>
  )
}
