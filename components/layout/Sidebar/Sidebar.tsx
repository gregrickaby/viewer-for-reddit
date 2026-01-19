'use client'

import {Collapse, Group, NavLink, ScrollArea, Stack, Text} from '@mantine/core'
import {
  IconBookmark,
  IconBrandGithub,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconFlame,
  IconHeart,
  IconInfoCircle,
  IconTrendingUp
} from '@tabler/icons-react'
import Link from 'next/link'
import {useMemo, useState} from 'react'

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean
  /** Username for authenticated user (for saved posts link) */
  username?: string
  /** User's subscribed subreddits */
  subscriptions?: Array<{
    name: string
    displayName: string
    icon?: string
  }>
  /** User's custom multireddits */
  multireddits?: Array<{
    name: string
    displayName: string
    path: string
  }>
}

/**
 * Navigation sidebar with feeds, subscriptions, and multireddits.
 * Adapts content based on authentication state.
 *
 * Features:
 * - Default feeds (Popular, All, About, Donate, GitHub)
 * - Saved Posts (authenticated only)
 * - User subscriptions (authenticated only)
 * - User multireddits (authenticated only)
 * - Collapsible sections
 * - Alphabetically sorted lists
 * - Scrollable long lists (max 400px height)
 *
 * @example
 * ```typescript
 * <Sidebar
 *   isAuthenticated={true}
 *   username="testuser"
 *   subscriptions={userSubs}
 *   multireddits={userMultis}
 * />
 * ```
 */
export function Sidebar({
  isAuthenticated,
  username,
  subscriptions = [],
  multireddits = []
}: Readonly<SidebarProps>) {
  const [navigationOpen, setNavigationOpen] = useState(true)
  const [subredditsOpen, setSubredditsOpen] = useState(false)
  const [multiredditsOpen, setMultiredditsOpen] = useState(false)

  const sortedSubscriptions = useMemo(
    () =>
      [...subscriptions].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      ),
    [subscriptions]
  )

  const sortedMultireddits = useMemo(
    () =>
      [...multireddits].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      ),
    [multireddits]
  )

  return (
    <ScrollArea h="100%" type="auto">
      <Stack gap="md">
        <div>
          <Group
            justify="space-between"
            mb="sm"
            onClick={() => setNavigationOpen(!navigationOpen)}
            style={{cursor: 'pointer'}}
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
                data-umami-event={isAuthenticated ? 'nav-home' : 'nav-popular'}
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
                  label="Saved Posts"
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

        {isAuthenticated && subscriptions.length > 0 && (
          <div>
            <Group
              justify="space-between"
              mb="sm"
              onClick={() => setSubredditsOpen(!subredditsOpen)}
              style={{cursor: 'pointer'}}
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
            <Collapse in={subredditsOpen}>
              <ScrollArea.Autosize mah={400}>
                <Stack gap={4}>
                  {sortedSubscriptions.map((sub) => (
                    <NavLink
                      key={sub.name}
                      component={Link}
                      href={`/r/${sub.name}`}
                      label={sub.displayName}
                      data-umami-event="nav-subreddit"
                    />
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Collapse>
          </div>
        )}

        {isAuthenticated && multireddits.length > 0 && (
          <div>
            <Group
              justify="space-between"
              mb="sm"
              onClick={() => setMultiredditsOpen(!multiredditsOpen)}
              style={{cursor: 'pointer'}}
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
            <Collapse in={multiredditsOpen}>
              <ScrollArea.Autosize mah={400}>
                <Stack gap={4}>
                  {sortedMultireddits.map((multi) => (
                    <NavLink
                      key={multi.path}
                      component={Link}
                      href={multi.path}
                      label={multi.displayName}
                      data-umami-event="nav-multireddit"
                    />
                  ))}
                </Stack>
              </ScrollArea.Autosize>
            </Collapse>
          </div>
        )}
      </Stack>
    </ScrollArea>
  )
}
