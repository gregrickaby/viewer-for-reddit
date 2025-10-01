'use client'

import {signIn, signOut, useSession} from 'next-auth/react'
import {
  ActionIcon,
  Avatar,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
  Text
} from '@mantine/core'
import {FaSignOutAlt, FaUserCircle} from 'react-icons/fa'
import {FaArrowRightToBracket, FaChevronDown} from 'react-icons/fa6'

export function UserMenu() {
  const {data: session, status} = useSession()

  if (status === 'loading') {
    return <Loader size="sm" aria-label="Loading authentication state" />
  }

  if (!session) {
    return (
      <Button
        leftSection={<FaArrowRightToBracket aria-hidden="true" />}
        onClick={() => signIn('reddit')}
        variant="light"
      >
        Log in
      </Button>
    )
  }

  const avatarSrc = session.user?.image ?? undefined
  const displayName = session.user?.name ?? 'Redditor'

  return (
    <Menu width={220} withinPortal>
      <Menu.Target>
        <ActionIcon
          aria-label="Open user menu"
          variant="light"
          radius="xl"
          size="xl"
          component="button"
        >
          <Group gap={6} align="center">
            <Avatar src={avatarSrc} radius="xl" size={28} alt={displayName}>
              <FaUserCircle aria-hidden="true" />
            </Avatar>
            <Text size="sm" fw={600} visibleFrom="sm">
              {displayName}
            </Text>
            <FaChevronDown aria-hidden="true" />
          </Group>
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Signed in</Menu.Label>
        <Stack gap="xs" px="sm" py="xs">
          <Group>
            <Avatar src={avatarSrc} radius="xl" alt={displayName}>
              <FaUserCircle aria-hidden="true" />
            </Avatar>
            <Stack gap={0}>
              <Text fw={600}>{displayName}</Text>
              <Text size="xs" c="dimmed">
                Scope: {session.scope ?? 'identity'}
              </Text>
            </Stack>
          </Group>
          {session.error && (
            <Text size="xs" c="red">
              {session.error}
            </Text>
          )}
        </Stack>
        <Menu.Divider />
        <Menu.Item
          leftSection={<FaSignOutAlt aria-hidden="true" />}
          onClick={() => signOut({callbackUrl: '/'})}
        >
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
