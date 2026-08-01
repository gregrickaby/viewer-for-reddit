'use client'

import {Loader, Stack, Text} from '@mantine/core'

interface TransitionOverlayProps {
  /** Whether the overlay is shown */
  visible: boolean
  /** Message shown beneath the loader, e.g. "Loading hot posts..." */
  label: string
}

/**
 * Absolutely-positioned loading overlay shown while a sort/tab navigation
 * transition is pending, dimming the content beneath it.
 */
export function TransitionOverlay({
  visible,
  label
}: Readonly<TransitionOverlayProps>) {
  if (!visible) return null

  return (
    <Stack
      gap="md"
      align="center"
      justify="center"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--mantine-color-body)',
        opacity: 0.9,
        zIndex: 10,
        pointerEvents: 'none'
      }}
    >
      <Loader size="lg" />
      <Text size="sm" c="dimmed">
        {label}
      </Text>
    </Stack>
  )
}
