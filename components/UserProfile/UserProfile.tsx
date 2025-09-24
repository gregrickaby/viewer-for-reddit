'use client'

import {UserComments} from '@/components/UserComments/UserComments'
import {UserPosts} from '@/components/UserPosts/UserPosts'
import {useGetUserAboutQuery} from '@/lib/store/services/redditApi'
import type {SortingOption} from '@/lib/types'
import {
  Avatar,
  Badge,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Title
} from '@mantine/core'
import {useState} from 'react'
import classes from './UserProfile.module.css'

interface UserProfileProps {
  username: string
  sort?: SortingOption
}

/**
 * UserProfile component.
 *
 * @param username - The Reddit username to display profile for
 * @param sort - The initial sorting option for posts and comments (default: 'new')
 * @returns JSX.Element for user profile with tab navigation between posts and comments
 */
export function UserProfile({
  username,
  sort = 'new'
}: Readonly<UserProfileProps>) {
  const [activeTab, setActiveTab] = useState<string | null>('posts')

  // Fetch user data with error handling
  const {
    data: user,
    isLoading: isLoadingUserInfo,
    isError: userError
  } = useGetUserAboutQuery(username)

  return (
    <Container size="xl" fluid>
      {/* Enhanced user information section with avatar and metadata */}
      {user && !userError && (
        <Paper withBorder p="md" mb="xl">
          <Group align="center" gap="md">
            <Avatar
              src={user.icon_img || user.subreddit?.icon_img}
              size="xl"
              alt={`u/${username}`}
            />
            <Stack gap="xs" style={{flex: 1}}>
              <Group gap="xs" align="center">
                {user.is_gold && (
                  <Badge color="yellow" variant="filled">
                    Gold
                  </Badge>
                )}
                {user.verified && (
                  <Badge color="blue" variant="filled">
                    Verified
                  </Badge>
                )}
                {user.is_mod && (
                  <Badge color="green" variant="filled">
                    Moderator
                  </Badge>
                )}
              </Group>

              <Group gap="xl">
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Link Karma:
                  </Text>
                  <Text size="sm" c="dimmed">
                    {user.link_karma?.toLocaleString() ?? 'N/A'}
                  </Text>
                </Group>

                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Comment Karma:
                  </Text>
                  <Text size="sm" c="dimmed">
                    {user.comment_karma?.toLocaleString() ?? 'N/A'}
                  </Text>
                </Group>

                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    Cake Day:
                  </Text>
                  <Text size="sm" c="dimmed">
                    {user.created_utc
                      ? new Date(user.created_utc * 1000).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </Group>
              </Group>

              {user.subreddit?.public_description && (
                <Text size="sm" c="dimmed">
                  {user.subreddit.public_description}
                </Text>
              )}
            </Stack>
          </Group>
        </Paper>
      )}

      {/* Loading state for user info */}
      {isLoadingUserInfo && (
        <Paper withBorder p="md" mb="xl">
          <Group align="center" gap="md">
            <Avatar size="xl" />
            <Stack gap="xs">
              <Title order={2}>u/{username}</Title>
              <Text size="sm" c="dimmed">
                Loading user information...
              </Text>
            </Stack>
          </Group>
        </Paper>
      )}

      {/* Error state for user info */}
      {userError && !isLoadingUserInfo && (
        <Paper withBorder p="md" mb="xl">
          <Group align="center" gap="md">
            <Avatar size="xl" />
            <Stack gap="xs">
              <Title order={2}>u/{username}</Title>
              <Text size="sm" c="red">
                Could not load user information
              </Text>
            </Stack>
          </Group>
        </Paper>
      )}

      <Tabs value={activeTab} onChange={setActiveTab} className={classes.tabs}>
        <Tabs.List>
          <Tabs.Tab value="posts">Posts</Tabs.Tab>
          <Tabs.Tab value="comments">Comments</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="posts" pt="md">
          {activeTab === 'posts' && (
            <UserPosts username={username} sort={sort} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="comments" pt="md">
          {activeTab === 'comments' && (
            <UserComments username={username} sort={sort} />
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}
