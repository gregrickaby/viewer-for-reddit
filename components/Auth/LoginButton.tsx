'use client'

import {Button, Tooltip} from '@mantine/core'
import {FaReddit} from 'react-icons/fa'

export interface LoginButtonProps {
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'default'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

/**
 * Login button component that triggers Reddit OAuth flow.
 *
 * When clicked, redirects user to Reddit for authentication.
 */
export function LoginButton({
  variant = 'filled',
  size = 'md',
  fullWidth = false
}: Readonly<LoginButtonProps>) {
  const handleLogin = () => {
    // Must use window.location.href for OAuth flow to ensure full page navigation
    // router.push() causes CORS errors because Next.js tries to fetch the OAuth endpoint
    // as an RSC request instead of performing a full redirect
    window.location.href = '/api/auth/login'
  }

  return (
    <Tooltip
      label="New! Sign in with your Reddit account to view your feeds and vote!"
      withArrow
    >
      <Button
        aria-label="Sign in with Reddit"
        data-umami-event="login button"
        fullWidth={fullWidth}
        h={45}
        onClick={handleLogin}
        rightSection={<FaReddit size={24} />}
        size={size}
        variant={variant}
      >
        Sign in
      </Button>
    </Tooltip>
  )
}
