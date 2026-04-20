'use client'

import {Tabs} from '@mantine/core'
import {IconMessageCircle, IconNote} from '@tabler/icons-react'
import {useRouter} from 'next/navigation'
import {ReactNode} from 'react'

interface UserProfileTabsProps {
  /** Reddit username (for URL construction) */
  username: string
  /** Currently active tab value ("posts" or "comments") */
  activeTab: string
  /** Content to render in the Posts tab panel */
  postsContent: ReactNode
  /** Content to render in the Comments tab panel */
  commentsContent: ReactNode
}

/**
 * Client component for user profile tabs navigation.
 * Handles tab switching with URL updates.
 */
export function UserProfileTabs({
  username,
  activeTab,
  postsContent,
  commentsContent
}: Readonly<UserProfileTabsProps>) {
  const router = useRouter()

  const handleTabChange = (value: string | null) => {
    if (value) {
      router.push(`/u/${username}?tab=${value}`)
    }
  }

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List grow>
        <Tabs.Tab value="posts" leftSection={<IconNote size={16} />}>
          Posts
        </Tabs.Tab>
        <Tabs.Tab
          value="comments"
          leftSection={<IconMessageCircle size={16} />}
        >
          Comments
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="posts" pt="md">
        {postsContent}
      </Tabs.Panel>

      <Tabs.Panel value="comments" pt="md">
        {commentsContent}
      </Tabs.Panel>
    </Tabs>
  )
}
