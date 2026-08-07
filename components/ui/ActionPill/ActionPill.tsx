'use client'

import {Anchor, Group, Paper, Text, UnstyledButton} from '@mantine/core'
import Link from 'next/link'

/**
 * Props for the ActionPill component.
 */
interface ActionPillProps {
  /** Icon element, already sized and colored by the caller */
  icon: React.ReactNode
  /** Optional visible text shown next to the icon (e.g. a count, or "Share") */
  label?: string
  /** Accessible name for the control */
  ariaLabel: string
  /** Renders as a link to this href instead of a button when provided */
  href?: string
  /** Click handler, used when `href` is not provided */
  onClick?: () => void
  /** Disables the button; ignored when rendered as a link */
  disabled?: boolean
}

/**
 * Shared pill-shaped action control (button or link), used for save, share,
 * and comment-count controls on both posts and comments so they look
 * identical everywhere they appear.
 */
export function ActionPill({
  icon,
  label,
  ariaLabel,
  href,
  onClick,
  disabled
}: Readonly<ActionPillProps>) {
  const content = (
    <Paper radius="xl" bg="var(--mantine-color-default)" px={8} py={4}>
      <Group gap={6} wrap="nowrap">
        {icon}
        {label && (
          <Text size="sm" aria-hidden={href ? true : undefined}>
            {label}
          </Text>
        )}
      </Group>
    </Paper>
  )

  if (href) {
    return (
      <Anchor
        component={Link}
        href={href}
        underline="never"
        c="inherit"
        aria-label={ariaLabel}
      >
        {content}
      </Anchor>
    )
  }

  return (
    <UnstyledButton
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{display: 'flex'}}
    >
      {content}
    </UnstyledButton>
  )
}
