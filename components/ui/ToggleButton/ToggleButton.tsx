'use client'

import {Button} from '@mantine/core'
import {ReactNode} from 'react'

interface ToggleButtonProps {
  /** Whether the toggle is currently "on" (e.g. following, subscribed) */
  active: boolean
  /** Disables the button while a toggle action is in flight */
  isPending: boolean
  /** Called when the button is clicked */
  onToggle: () => void
  /** Label shown when active */
  activeLabel: string
  /** Label shown when inactive */
  inactiveLabel: string
  /** Icon shown when active */
  activeIcon: ReactNode
  /** Icon shown when inactive */
  inactiveIcon: ReactNode
  /** aria-label used when active */
  activeAriaLabel: string
  /** aria-label used when inactive */
  inactiveAriaLabel: string
}

/**
 * Generic two-state toggle button (follow/unfollow, subscribe/unsubscribe):
 * filled+blue when inactive, light+gray when active.
 */
export function ToggleButton({
  active,
  isPending,
  onToggle,
  activeLabel,
  inactiveLabel,
  activeIcon,
  inactiveIcon,
  activeAriaLabel,
  inactiveAriaLabel
}: Readonly<ToggleButtonProps>) {
  return (
    <Button
      color={active ? 'gray' : 'blue'}
      disabled={isPending}
      onClick={onToggle}
      variant={active ? 'light' : 'filled'}
      leftSection={active ? activeIcon : inactiveIcon}
      size="sm"
      aria-label={active ? activeAriaLabel : inactiveAriaLabel}
    >
      {active ? activeLabel : inactiveLabel}
    </Button>
  )
}
