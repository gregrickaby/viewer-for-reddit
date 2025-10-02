'use client'

import type {ClientSession} from '@/lib/auth/session'
import {clearAuth, setAuth} from '@/lib/store/features/authSlice'
import {useAppDispatch} from '@/lib/store/hooks'
import {Avatar, Group, Menu, Text} from '@mantine/core'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {FaReddit, FaSignOutAlt, FaUser} from 'react-icons/fa'
import {LoginButton} from './LoginButton'

/**
 * User menu component for authenticated users.
 *
 * Displays user avatar and dropdown menu with profile info
 * and logout option. Shows login button for anonymous users.
 */
export function UserMenu() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [loading, setLoading] = useState(true)
  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    // Fetch client-safe session on mount
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        setSession(data)
        if (data?.isAuthenticated) {
          dispatch(
            setAuth({
              username: data.username,
              expiresAt: data.expiresAt
            })
          )
        }
      })
      .finally(() => setLoading(false))
  }, [dispatch])

  // Auto-refresh token 5 minutes before expiration
  useEffect(() => {
    if (!session?.expiresAt) return

    const refreshToken = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {method: 'POST'})
        if (response.ok) {
          const data = await response.json()
          setSession((prev) =>
            prev ? {...prev, expiresAt: data.expiresAt} : null
          )
          dispatch(
            setAuth({
              username: session.username,
              expiresAt: data.expiresAt
            })
          )
        } else {
          // Refresh failed, clear session
          dispatch(clearAuth())
          setSession(null)
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        dispatch(clearAuth())
        setSession(null)
      }
    }

    // Calculate time until refresh (5 minutes before expiration)
    const now = Date.now()
    const bufferMs = 5 * 60 * 1000 // 5 minutes
    const timeUntilRefresh = session.expiresAt - now - bufferMs

    // Only set timer if token hasn't expired yet
    if (timeUntilRefresh > 0) {
      const timer = setTimeout(refreshToken, timeUntilRefresh)
      return () => clearTimeout(timer)
    }

    // Token already expired, refresh immediately
    refreshToken()
  }, [session?.expiresAt, session?.username, dispatch])

  // Loading state
  if (loading) {
    return (
      <Avatar radius="xl" size="md" color="gray">
        <FaUser />
      </Avatar>
    )
  }

  // Not authenticated - show login button
  if (!session) {
    return <LoginButton variant="light" size="md" />
  }

  // Authenticated - show user menu
  const handleLogout = async () => {
    await fetch('/api/auth/logout', {method: 'POST'})
    dispatch(clearAuth())
    setSession(null)
    router.push('/')
    router.refresh()
  }

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Avatar
          src={session.avatarUrl}
          radius="xl"
          size="md"
          color="redditColorScheme"
          style={{cursor: 'pointer'}}
          aria-label={`User menu for ${session.username}`}
        >
          {!session.avatarUrl && <FaReddit />}
        </Avatar>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group gap="xs">
            <Avatar
              src={session.avatarUrl}
              radius="xl"
              size="xs"
              color="redditColorScheme"
              style={{cursor: 'pointer'}}
              aria-label={`User menu for ${session.username}`}
            >
              {!session.avatarUrl && <FaReddit />}
            </Avatar>
            <Text size="sm" fw={600}>
              u/{session.username}
            </Text>
          </Group>
        </Menu.Label>

        <Menu.Divider />

        <Menu.Item leftSection={<FaSignOutAlt />} onClick={handleLogout}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
