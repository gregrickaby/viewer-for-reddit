'use client'

import {Button} from '@mantine/core'
import {FaReddit} from 'react-icons/fa'

export interface LoginButtonProps {
  /**
   * Button variant style.
   */
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'default'

  /**
   * Button size.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * Full width button.
   */
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
    <Button
      leftSection={<FaReddit />}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleLogin}
      aria-label="Sign in with Reddit"
    >
      Sign in with Reddit
    </Button>
  )
}
