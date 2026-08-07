'use client'

import {Group, Text, UnstyledButton} from '@mantine/core'
import {spotlight} from '@mantine/spotlight'
import {IconSearch} from '@tabler/icons-react'
import styles from './DesktopSearch.module.css'

/**
 * Wide, centered search trigger shown in the header on desktop viewports,
 * matching reddit.com's layout. Opens the same Spotlight overlay mounted by
 * `MobileSearch`.
 */
export function DesktopSearch() {
  return (
    <UnstyledButton
      onClick={spotlight.open}
      aria-label="Open search"
      className={styles.searchTrigger}
    >
      <IconSearch size={14} aria-hidden="true" />
      <Text size="sm" c="dimmed" style={{flex: 1}}>
        Search Reddit...
      </Text>
      <Group gap={4}>
        <kbd className={styles.shortcutKey}>/</kbd>
      </Group>
    </UnstyledButton>
  )
}
