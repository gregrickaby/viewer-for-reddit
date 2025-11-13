'use client'

import {useSubredditAbout} from '@/lib/hooks/subreddit/useSubredditAbout/useSubredditAbout'
import {Group, Loader, Modal, Stack, Text} from '@mantine/core'

interface SubredditAboutProps {
  onClose: () => void
  opened: boolean
  subreddit: string
}

/**
 * SubredditAbout modal component.
 *
 * Displays key subreddit information in a modal dialog:
 * - Name
 * - Description
 * - Created date
 * - Subscriber count
 * - Currently online users
 *
 * @param opened - Whether the modal is open
 * @param onClose - Callback to close the modal
 * @param subreddit - The subreddit name to fetch information for
 */
export function SubredditAbout({
  opened,
  onClose,
  subreddit
}: Readonly<SubredditAboutProps>) {
  const {name, description, createdDate, subscribers, activeUsers, isLoading} =
    useSubredditAbout(subreddit)

  return (
    <Modal
      onClose={onClose}
      opened={opened}
      title={`About r/${name}`}
      size="lg"
    >
      {isLoading ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : (
        <Stack gap="md">
          {description && (
            <div>
              <Text fw={500} size="sm" c="dimmed">
                Description
              </Text>
              <Text size="sm">{description}</Text>
            </div>
          )}

          <div>
            <Text fw={500} size="sm" c="dimmed">
              Created
            </Text>
            <Text size="sm">{createdDate}</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              Members
            </Text>
            <Text size="sm">{subscribers}</Text>
          </div>

          <div>
            <Text fw={500} size="sm" c="dimmed">
              Online
            </Text>
            <Text size="sm">{activeUsers}</Text>
          </div>
        </Stack>
      )}
    </Modal>
  )
}
