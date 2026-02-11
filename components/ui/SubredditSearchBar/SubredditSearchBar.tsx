'use client'

import {ActionIcon, Group, TextInput} from '@mantine/core'
import {IconSearch, IconX} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {useState, useTransition} from 'react'

/**
 * Props for the SubredditSearchBar component.
 */
interface SubredditSearchBarProps {
  /** Subreddit to search within */
  subreddit: string
}

/**
 * Search bar for searching within a specific subreddit.
 * Allows users to search for posts within the current subreddit.
 *
 * Features:
 * - Search within current subreddit
 * - Clear button when input has text
 * - Loading state during navigation
 * - Keyboard navigation (Enter to search)
 *
 * @example
 * ```typescript
 * <SubredditSearchBar subreddit="programming" />
 * ```
 */
export function SubredditSearchBar({
  subreddit
}: Readonly<SubredditSearchBarProps>) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isPending) return
    if (!query.trim()) return

    startTransition(() => {
      const encodedQuery = encodeURIComponent(query.trim())
      router.push(`/r/${subreddit}/search/${encodedQuery}`)
    })
  }

  const handleClear = () => {
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        placeholder={`Search r/${subreddit}...`}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        disabled={isPending}
        leftSection={<IconSearch size={16} />}
        rightSection={
          <Group
            gap={4}
            wrap="nowrap"
            style={{
              opacity: query ? 1 : 0,
              pointerEvents: query ? 'auto' : 'none'
            }}
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleClear}
              aria-label="Clear search"
              tabIndex={query ? 0 : -1}
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>
        }
        aria-label={`Search within r/${subreddit}`}
        data-umami-event="subreddit-search"
      />
    </form>
  )
}
