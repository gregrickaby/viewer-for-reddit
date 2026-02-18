'use client'

import {MultiredditManager} from '@/components/ui/MultiredditManager/MultiredditManager'
import {SubredditManager} from '@/components/ui/SubredditManager/SubredditManager'
import {
  useSubscriptionsFilterSort,
  type ManagedMultireddit,
  type ManagedSubscription
} from '@/lib/hooks'
import {
  ActionIcon,
  Avatar,
  Collapse,
  Group,
  NavLink,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {
  IconBookmark,
  IconBrandGithub,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconFlame,
  IconHeart,
  IconInfoCircle,
  IconMessage,
  IconSearch,
  IconSettings,
  IconTrendingUp,
  IconUser
} from '@tabler/icons-react'
import Link from 'next/link'
import {useState} from 'react'
import styles from './Sidebar.module.css'

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Username for authenticated user (for saved items link) */
  username?: string
  /** User's subscribed subreddits */
  subscriptions?: ManagedSubscription[]
  /** User's custom multireddits */
  multireddits?: ManagedMultireddit[]
  /** Users being followed */
  following?: Array<{
    name: string
    id: string
    date: number
    note?: string
  }>
}

/**
 * Navigation sidebar with feeds, subscriptions, and multireddits.
 * Adapts content based on authentication state.
 *
 * Features:
 * - Default feeds (Popular, All, About, Donate, GitHub)
 * - Saved items (posts and comments) (authenticated only)
 * - User subscriptions with search and infinite scroll (authenticated only)
 * - User multireddits (authenticated only, sorted alphabetically)
 * - Followed users (authenticated only, sorted alphabetically)
 * - Collapsible sections
 * - Searchable subscription list (unsorted to prevent jumping)
 * - Lazy loading for large subscription lists
 *
 * @example
 * ```typescript
 * <Sidebar
 *   isAuthenticated={true}
 *   username="testuser"
 *   subscriptions={userSubs}
 *   multireddits={userMultis}
 *   following={userFollowing}
 * />
 * ```
 */
export function Sidebar({
  isAuthenticated,
  username,
  subscriptions = [],
  multireddits = [],
  following = []
}: Readonly<SidebarProps>) {
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [subredditsOpen, setSubredditsOpen] = useState(true)
  const [multiredditsOpen, setMultiredditsOpen] = useState(true)
  const [followingOpen, setFollowingOpen] = useState(true)
  const [managerOpened, {open: openManager, close: closeManager}] =
    useDisclosure(false)
  const [subManagerOpened, {open: openSubManager, close: closeSubManager}] =
    useDisclosure(false)

  const {
    filteredSubscriptions,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy
  } = useSubscriptionsFilterSort({
    initialSubscriptions: subscriptions
  })

  const sortedMultireddits = [...multireddits].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  const sortedFollowing = [...following].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  return (
    <>
      <ScrollArea type="auto" offsetScrollbars>
        <Stack gap="md">
          <div>
            <Group
              justify="space-between"
              mb="sm"
              onClick={() => setNavigationOpen(!navigationOpen)}
              className={styles.toggleHeader}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setNavigationOpen(!navigationOpen)
                }
              }}
              aria-expanded={navigationOpen}
              aria-label={
                navigationOpen ? 'Collapse Navigation' : 'Expand Navigation'
              }
            >
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Navigation
              </Text>
              {navigationOpen ? (
                <IconChevronUp aria-hidden="true" size={16} />
              ) : (
                <IconChevronDown aria-hidden="true" size={16} />
              )}
            </Group>
            <Collapse in={navigationOpen}>
              <Stack gap={4}>
                <NavLink
                  component={Link}
                  href="/"
                  label={isAuthenticated ? 'Home' : 'Popular'}
                  leftSection={<IconFlame size={16} />}
                  data-umami-event={
                    isAuthenticated ? 'nav-home' : 'nav-popular'
                  }
                />
                <NavLink
                  component={Link}
                  href="/r/all"
                  label="All"
                  leftSection={<IconTrendingUp size={16} />}
                  data-umami-event="nav-all"
                />
                {isAuthenticated && username && (
                  <NavLink
                    component={Link}
                    href={`/user/${username}/saved`}
                    label="Saved"
                    leftSection={<IconBookmark size={16} />}
                    data-umami-event="nav-saved"
                  />
                )}
                <NavLink
                  component={Link}
                  href="/about"
                  label="About"
                  leftSection={<IconInfoCircle size={16} />}
                  data-umami-event="nav-about"
                />
                <NavLink
                  component={Link}
                  href="/donate"
                  label="Donate"
                  leftSection={<IconHeart size={16} />}
                  data-umami-event="nav-donate"
                />
                <NavLink
                  component="a"
                  href="https://github.com/gregrickaby/viewer-for-reddit"
                  label="GitHub"
                  leftSection={<IconBrandGithub size={16} />}
                  rightSection={<IconExternalLink size={14} />}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="nav-github"
                />
              </Stack>
            </Collapse>
          </div>

          {isAuthenticated && multireddits.length > 0 && (
            <div>
              <Group justify="space-between" mb="sm">
                <Group
                  flex={1}
                  onClick={() => setMultiredditsOpen(!multiredditsOpen)}
                  className={styles.toggleHeader}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setMultiredditsOpen(!multiredditsOpen)
                    }
                  }}
                  aria-expanded={multiredditsOpen}
                  aria-label={
                    multiredditsOpen
                      ? 'Collapse Multireddits'
                      : 'Expand Multireddits'
                  }
                >
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    My Multireddits
                  </Text>
                  {multiredditsOpen ? (
                    <IconChevronUp aria-hidden="true" size={16} />
                  ) : (
                    <IconChevronDown aria-hidden="true" size={16} />
                  )}
                </Group>
                <Tooltip label="Manage multireddits" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={openManager}
                    aria-label="Manage multireddits"
                  >
                    <IconSettings size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Collapse in={multiredditsOpen}>
                <ScrollArea.Autosize mah={400}>
                  <Stack gap={4}>
                    {sortedMultireddits.map((multi) => (
                      <NavLink
                        key={multi.path}
                        component={Link}
                        href={multi.path}
                        label={multi.displayName}
                        leftSection={
                          multi.icon ? (
                            <Avatar
                              src={multi.icon}
                              alt={`${multi.displayName} icon`}
                              size={20}
                              radius="sm"
                            />
                          ) : (
                            <Avatar size={20} radius="sm" color="blue">
                              {multi.displayName.charAt(0).toUpperCase()}
                            </Avatar>
                          )
                        }
                        data-umami-event="nav-multireddit"
                      />
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              </Collapse>
            </div>
          )}

          {isAuthenticated && following.length > 0 && (
            <div>
              <Group
                justify="space-between"
                mb="sm"
                onClick={() => setFollowingOpen(!followingOpen)}
                className={styles.toggleHeader}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setFollowingOpen(!followingOpen)
                  }
                }}
                aria-expanded={followingOpen}
                aria-label={
                  followingOpen ? 'Collapse Following' : 'Expand Following'
                }
              >
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Following
                </Text>
                {followingOpen ? (
                  <IconChevronUp aria-hidden="true" size={16} />
                ) : (
                  <IconChevronDown aria-hidden="true" size={16} />
                )}
              </Group>
              <Collapse in={followingOpen}>
                <ScrollArea.Autosize mah={400}>
                  <Stack gap={4}>
                    {sortedFollowing.map((user) => (
                      <NavLink
                        key={user.id}
                        component={Link}
                        href={`/u/${user.name}`}
                        label={user.name}
                        description={user.note}
                        leftSection={<IconUser size={16} />}
                        data-umami-event="nav-following"
                      />
                    ))}
                  </Stack>
                </ScrollArea.Autosize>
              </Collapse>
            </div>
          )}

          {isAuthenticated && subscriptions.length > 0 && (
            <div>
              <Group justify="space-between" mb="sm">
                <Group
                  flex={1}
                  onClick={() => setSubredditsOpen(!subredditsOpen)}
                  className={styles.toggleHeader}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSubredditsOpen(!subredditsOpen)
                    }
                  }}
                  aria-expanded={subredditsOpen}
                  aria-label={
                    subredditsOpen
                      ? 'Collapse My Subreddits'
                      : 'Expand My Subreddits'
                  }
                >
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    My Subreddits
                  </Text>
                  {subredditsOpen ? (
                    <IconChevronUp aria-hidden="true" size={16} />
                  ) : (
                    <IconChevronDown aria-hidden="true" size={16} />
                  )}
                </Group>
                <Tooltip label="Manage subreddits" withArrow>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    onClick={openSubManager}
                    aria-label="Manage subreddits"
                  >
                    <IconSettings size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Collapse in={subredditsOpen}>
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
                    onChange={(value) =>
                      setSortBy(value as 'default' | 'a-z' | 'z-a')
                    }
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
              </Collapse>
            </div>
          )}
        </Stack>
      </ScrollArea>
      <MultiredditManager
        opened={managerOpened}
        onClose={closeManager}
        multireddits={multireddits}
      />
      <SubredditManager
        opened={subManagerOpened}
        onClose={closeSubManager}
        subscriptions={subscriptions}
      />
    </>
  )
}
