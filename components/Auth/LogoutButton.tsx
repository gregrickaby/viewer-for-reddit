'use client'

import {clearAuth} from '@/lib/store/features/authSlice'
import {useAppDispatch} from '@/lib/store/hooks'
import {Button} from '@mantine/core'
import {FaSignOutAlt} from 'react-icons/fa'

export interface LogoutButtonProps {
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
 * Logout button component that signs user out.
 *
 * When clicked, clears session and redirects to home.
 */
export function LogoutButton({
  variant = 'light',
  size = 'md',
  fullWidth = false
}: Readonly<LogoutButtonProps>) {
  const dispatch = useAppDispatch()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {method: 'POST'})
    dispatch(clearAuth())
    window.location.href = '/'
  }

  return (
    <Button
      leftSection={<FaSignOutAlt />}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={handleLogout}
      aria-label="Sign out"
    >
      Sign out
    </Button>
  )
}
