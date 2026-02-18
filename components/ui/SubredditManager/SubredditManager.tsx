'use client'

import {
  type ManagedSubscription,
  useMultiredditSearch,
  useSubredditManager
} from '@/lib/hooks'
import {formatNumber} from '@/lib/utils/formatters'
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Combobox,
  Divider,
  Drawer,
  Group,
  InputBase,
  Loader,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  useCombobox
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconMinus,
  IconPlus,
  IconX
} from '@tabler/icons-react'
import Link from 'next/link'

interface SubredditManagerProps {
  /** Whether the drawer is open */
  opened: boolean
  /** Callback to close the drawer */
  onClose: () => void
  /** Initial subscriptions list from server */
  subscriptions: ManagedSubscription[]
}

/**
 * Drawer panel for managing subreddit subscriptions.
 * Allows searching for subreddits with autocomplete and joining/leaving them.
 *
 * @example
 * ```typescript
 * <SubredditManager
 *   opened={drawerOpen}
 *   onClose={closeDrawer}
 *   subscriptions={subscriptions}
 * />
 * ```
 */
export function SubredditManager({
  opened,
  onClose,
  subscriptions: initialSubscriptions
}: Readonly<SubredditManagerProps>) {
  const {
    subscriptions,
    error,
    isPending,
    clearError,
    isSubscribed,
    join,
    leave
  } = useSubredditManager({initialSubscriptions})

  const {query, setQuery, results, isLoading, clearResults} =
    useMultiredditSearch()

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  // Only show subreddit results (not users) in this manager
  const subredditResults = results.filter((r) => r.type === 'subreddit')
  const showDropdown = subredditResults.length > 0 || isLoading

  const handleSelect = (displayName: string) => {
    const item = subredditResults.find((r) => r.displayName === displayName)
    if (!item) return
    if (isSubscribed(item.name)) {
      leave(item.name)
    } else {
      join({name: item.name, displayName: item.displayName, icon: item.icon})
    }
    clearResults()
    combobox.closeDropdown()
  }

  const handleClose = () => {
    setQuery('')
    clearResults()
    onClose()
  }

  const sortedSubscriptions = [...subscriptions].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title={
        <Text fw={700} size="md">
          Manage Subreddits
        </Text>
      }
      position="right"
      size="sm"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Group
              justify="space-between"
              align="center"
              gap="xs"
              wrap="nowrap"
            >
              <Text size="sm" flex={1}>
                {error}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={clearError}
                data-testid="dismiss-error-btn"
                aria-label="Dismiss error"
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Alert>
        )}

        {/* Search section */}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Find a Subreddit
          </Text>
          <Combobox onOptionSubmit={handleSelect} store={combobox} withinPortal>
            <Combobox.Target>
              <InputBase
                placeholder="Search subreddits..."
                value={query}
                onChange={(e) => {
                  setQuery(e.currentTarget.value)
                  combobox.openDropdown()
                }}
                onBlur={() => combobox.closeDropdown()}
                rightSection={isLoading ? <Loader size={14} /> : null}
                size="sm"
                aria-label="Search subreddits"
              />
            </Combobox.Target>

            <Combobox.Dropdown hidden={!showDropdown}>
              <Combobox.Options>
                {isLoading && (
                  <Combobox.Empty>
                    <Group justify="center" p="xs">
                      <Loader size="sm" />
                    </Group>
                  </Combobox.Empty>
                )}
                {!isLoading &&
                  subredditResults.map((item) => {
                    const subscribed = isSubscribed(item.name)
                    return (
                      <Combobox.Option value={item.displayName} key={item.name}>
                        <Group wrap="nowrap" gap="sm" justify="space-between">
                          <Group wrap="nowrap" gap="sm" flex={1}>
                            <Avatar
                              src={item.icon}
                              size={24}
                              radius="sm"
                              alt={item.displayName}
                            />
                            <Stack gap={0}>
                              <Text size="xs" fw={500}>
                                {item.displayName}
                              </Text>
                              {item.subscribers != null &&
                                item.subscribers > 0 && (
                                  <Text size="xs" c="dimmed">
                                    {formatNumber(item.subscribers)} members
                                  </Text>
                                )}
                            </Stack>
                          </Group>
                          <Tooltip
                            label={
                              subscribed
                                ? `Leave r/${item.name}`
                                : `Join r/${item.name}`
                            }
                            withArrow
                          >
                            <ActionIcon
                              size="sm"
                              variant={subscribed ? 'light' : 'filled'}
                              color={subscribed ? 'gray' : 'blue'}
                              disabled={isPending}
                              aria-label={
                                subscribed
                                  ? `Leave r/${item.name}`
                                  : `Join r/${item.name}`
                              }
                            >
                              {subscribed ? (
                                <IconMinus size={12} />
                              ) : (
                                <IconPlus size={12} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Combobox.Option>
                    )
                  })}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
        </Stack>

        {subscriptions.length > 0 && (
          <>
            <Divider />
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Your Subscriptions
              </Text>
              <Badge size="xs" variant="light" color="blue">
                {subscriptions.length}
              </Badge>
            </Group>

            <ScrollArea.Autosize mah={500}>
              <Stack gap={4}>
                {sortedSubscriptions.map((sub) => (
                  <Group key={sub.name} justify="space-between" gap="xs">
                    <NavLink
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
                          <Avatar size={20} radius="sm" color="blue">
                            {sub.displayName
                              .replace(/^r\//, '')
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar>
                        )
                      }
                      onClick={handleClose}
                      flex={1}
                      styles={{root: {borderRadius: 4}}}
                    />
                    <Tooltip label={`Leave r/${sub.name}`} withArrow>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="red"
                        leftSection={<IconCheck size={12} />}
                        onClick={() => leave(sub.name)}
                        disabled={isPending}
                        aria-label={`Leave r/${sub.name}`}
                      >
                        Joined
                      </Button>
                    </Tooltip>
                  </Group>
                ))}
              </Stack>
            </ScrollArea.Autosize>
          </>
        )}

        {subscriptions.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No subreddit subscriptions yet. Use the search above to find some!
          </Text>
        )}
      </Stack>
    </Drawer>
  )
}
