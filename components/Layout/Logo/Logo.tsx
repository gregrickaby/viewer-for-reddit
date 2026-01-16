import AppIcon from '@/app/icon.png'
import {Anchor, Group, Text} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Application logo with icon and text.
 * Links to the home page (/).
 *
 * Features:
 * - App icon image (32x32px on mobile, 38x38px on desktop)
 * - Text hidden on mobile (visibleFrom="sm")
 * - Next.js Image optimization with priority loading
 * - No underline on hover
 *
 * @example
 * ```typescript
 * <Logo />
 * ```
 */
export function Logo() {
  return (
    <Anchor component={Link} href="/" underline="never" c="inherit">
      <Group gap="xs" wrap="nowrap">
        <Image
          alt="Reddit Viewer Logo"
          height={32}
          src={AppIcon}
          width={32}
          priority
          style={{display: 'block'}}
        />
        <Text size="xl" fw={700} visibleFrom="sm">
          Reddit Viewer
        </Text>
      </Group>
    </Anchor>
  )
}
