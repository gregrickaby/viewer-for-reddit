'use client'

import {UserComments} from '@/components/UserComments/UserComments'
import {UserPosts} from '@/components/UserPosts/UserPosts'
import type {SortingOption} from '@/lib/types'
import {Container, Tabs} from '@mantine/core'
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

  return (
    <Container size="xl" fluid>
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
