'use client'

import {SearchBar} from '@/components/ui/SearchBar/SearchBar'
import {ActionIcon, Group, Text, UnstyledButton} from '@mantine/core'
import {spotlight} from '@mantine/spotlight'
import {IconSearch} from '@tabler/icons-react'

/**
 * Search triggers for the header.
 * Mobile shows an icon button; desktop shows a search input button.
 * Both open the Spotlight overlay. The Spotlight overlay is also rendered here.
 */
export function MobileSearch() {
  return (
    <>
      {/* Mobile: icon button */}
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        hiddenFrom="sm"
        aria-label="Search"
        data-umami-event="open-mobile-search"
        onClick={spotlight.open}
      >
        <IconSearch aria-hidden="true" size={20} />
      </ActionIcon>

      {/* Desktop: input-styled button */}
      <UnstyledButton
        visibleFrom="sm"
        onClick={spotlight.open}
        aria-label="Open search"
        data-umami-event="open-desktop-search"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-default-border)',
          background: 'var(--mantine-color-default)',
          color: 'var(--mantine-color-dimmed)',
          width: 280,
          fontSize: 'var(--mantine-font-size-sm)',
          cursor: 'pointer'
        }}
      >
        <IconSearch size={14} aria-hidden="true" />
        <Text size="sm" c="dimmed" style={{flex: 1}}>
          Search Reddit...
        </Text>
        <Group gap={4}>
          <kbd
            style={{
              padding: '1px 5px',
              borderRadius: 4,
              border: '1px solid var(--mantine-color-default-border)',
              fontSize: 11,
              background: 'var(--mantine-color-default)'
            }}
          >
            /
          </kbd>
        </Group>
      </UnstyledButton>

      {/* Spotlight overlay – mounted once, opened programmatically */}
      <SearchBar />
    </>
  )
}
