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
 * UserProfile component displays either posts or comments for a Reddit user
 * with tab-based navigation between the two views.
 */
export function UserProfile({
  username,
  sort = 'new'
}: Readonly<UserProfileProps>) {
  const [activeTab, setActiveTab] = useState<string | null>('posts')

  return (
    <Container>
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
