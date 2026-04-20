'use client'

import type {ManagedSubscription} from '@/lib/hooks/useSubredditManager'
import {useSubscriptionsFilterSort} from '@/lib/hooks/useSubscriptionsFilterSort'
import {
  Avatar,
  NavLink,
  ScrollArea,
  Select,
  Stack,
  TextInput
} from '@mantine/core'
import {IconMessage, IconSearch} from '@tabler/icons-react'
import Link from 'next/link'

/**
 * Props for the SubscriptionFilterList component.
 */
interface SubscriptionFilterListProps {
  /** All subscriptions */
  subscriptions: ManagedSubscription[]
}

/**
 * Filterable and sortable list of subreddit subscriptions.
 * Uses client-side filtering and sorting.
 *
 * @example
 * ```typescript
 * <SubscriptionFilterList subscriptions={userSubs} />
 * ```
 */
export function SubscriptionFilterList({
  subscriptions
}: Readonly<SubscriptionFilterListProps>) {
  const {
    filteredSubscriptions,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy
  } = useSubscriptionsFilterSort({
    initialSubscriptions: subscriptions
  })

  return (
    <Stack gap="xs">
      <TextInput
        id="sidebar-search-input"
        placeholder="Search subreddits..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
        size="xs"
        aria-label="Search subscriptions"
      />
      <Select
        id="sidebar-sort-select"
        size="xs"
        data={[
          {value: 'default', label: 'Default Order'},
          {value: 'a-z', label: 'A-Z'},
          {value: 'z-a', label: 'Z-A'}
        ]}
        value={sortBy}
        onChange={(value) => setSortBy(value as 'default' | 'a-z' | 'z-a')}
        aria-label="Sort subscriptions"
        allowDeselect={false}
      />
      <ScrollArea.Autosize mah={400}>
        <Stack gap={4}>
          {filteredSubscriptions.map((sub) => (
            <NavLink
              key={sub.name}
              component={Link}
              href={`/r/${sub.name}`}
              label={sub.displayName}
              leftSection={
                sub.icon ? (
                  <Avatar
                    src={sub.icon}
                    alt={`${sub.displayName} icon`}
                    size={20}
                    radius="sm"
                  />
                ) : (
                  <IconMessage size={16} />
                )
              }
              data-umami-event="nav-subreddit"
            />
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  )
}
