'use client'

import {useSearch} from '@/lib/hooks/useSearch'
import {formatNumber} from '@/lib/utils/formatters'
import {Avatar, Badge, Divider, Group, Loader, Stack, Text} from '@mantine/core'
import {Spotlight} from '@mantine/spotlight'
import {IconSearch} from '@tabler/icons-react'

/**
 * Subreddit search powered by Mantine Spotlight.
 * Renders a command-palette overlay with live subreddit suggestions.
 * Triggered by Cmd+K, / shortcut, or programmatically via spotlight.open().
 */
export function SearchBar({
  forceOpened
}: Readonly<{forceOpened?: boolean}> = {}) {
  const {
    query,
    setQuery,
    groupedResults,
    isLoading,
    hasError,
    errorMessage,
    handleOptionSelect,
    handleSubmit
  } = useSearch()

  const {communities, nsfw} = groupedResults
  const hasResults = communities.length > 0 || nsfw.length > 0
  const showEmpty = query.length >= 2 && !isLoading && !hasError && !hasResults

  const communityActions = communities.map((item) => (
    <Spotlight.Action
      key={item.name}
      onClick={() => handleOptionSelect(item.displayName)}
    >
      <Group wrap="nowrap" gap="sm">
        <Avatar src={item.icon} size={28} radius="sm" alt={item.displayName} />
        <Stack gap={0}>
          <Text size="sm" fw={500}>
            {item.displayName}
          </Text>
          {item.subscribers && item.subscribers > 0 && (
            <Text size="xs" c="dimmed">
              {formatNumber(item.subscribers)} members
            </Text>
          )}
        </Stack>
      </Group>
    </Spotlight.Action>
  ))

  const nsfwActions = nsfw.map((item) => (
    <Spotlight.Action
      key={item.name}
      onClick={() => handleOptionSelect(item.displayName)}
    >
      <Group wrap="nowrap" gap="sm">
        <Avatar src={item.icon} size={28} radius="sm" alt={item.displayName} />
        <Stack gap={0}>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {item.displayName}
            </Text>
            <Badge size="xs" color="red" variant="filled">
              NSFW
            </Badge>
          </Group>
          {item.subscribers && item.subscribers > 0 && (
            <Text size="xs" c="dimmed">
              {formatNumber(item.subscribers)} members
            </Text>
          )}
        </Stack>
      </Group>
    </Spotlight.Action>
  ))

  return (
    <Spotlight.Root
      query={query}
      onQueryChange={setQuery}
      onSpotlightClose={() => setQuery('')}
      shortcut={['mod + K', '/']}
      clearQueryOnClose
      closeOnActionTrigger
      zIndex={500}
      forceOpened={forceOpened}
    >
      <Spotlight.Search
        placeholder="Search Reddit..."
        leftSection={<IconSearch size={18} aria-hidden="true" />}
        rightSection={isLoading ? <Loader size={16} /> : null}
        aria-label="Search Reddit or subreddits"
        data-umami-event="search"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
      />

      <Spotlight.ActionsList>
        {isLoading && (
          <Spotlight.Empty>
            <Group justify="center" p="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Searching...
              </Text>
            </Group>
          </Spotlight.Empty>
        )}

        {!isLoading && hasError && (
          <Spotlight.Empty>
            <Text size="sm" c="red">
              {errorMessage || 'Error loading results'}
            </Text>
          </Spotlight.Empty>
        )}

        {showEmpty && (
          <Spotlight.Empty>No subreddits found for "{query}"</Spotlight.Empty>
        )}

        {!isLoading && !hasError && hasResults && (
          <>
            {communities.length > 0 && (
              <Spotlight.ActionsGroup label="Communities">
                {communityActions}
              </Spotlight.ActionsGroup>
            )}

            {communities.length > 0 && nsfw.length > 0 && <Divider my="xs" />}

            {nsfw.length > 0 && (
              <Spotlight.ActionsGroup label="NSFW">
                {nsfwActions}
              </Spotlight.ActionsGroup>
            )}
          </>
        )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  )
}
