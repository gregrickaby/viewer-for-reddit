import {UserMenu} from '@/components/UI/Auth/UserMenu'
import {Settings} from '@/components/UI/Settings/Settings'
import config from '@/lib/config'
import {ActionIcon, Box, Group, Tooltip} from '@mantine/core'
import {FaGithub} from 'react-icons/fa'
import {SiBuymeacoffee} from 'react-icons/si'

export function HeaderIcons() {
  return (
    <Group gap="xs">
      <Box visibleFrom="sm">
        <Settings />
      </Box>
      <Tooltip label="View source code" position="bottom" withArrow>
        <ActionIcon
          aria-label="View source code"
          color="gray"
          component="a"
          data-umami-event="github button"
          href={config.githubUrl}
          rel="noopener noreferrer"
          size="xl"
          target="_blank"
          variant="light"
          visibleFrom="sm"
        >
          <FaGithub size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Buy me a coffee 🥺" position="bottom" withArrow>
        <ActionIcon
          aria-label="Buy me a coffee"
          color="gray"
          component="a"
          data-umami-event="buy me a coffee button"
          href="https://buymeacoffee.com/gregrickaby"
          rel="noopener noreferrer"
          size="xl"
          target="_blank"
          variant="light"
          visibleFrom="sm"
        >
          <SiBuymeacoffee size={18} />
        </ActionIcon>
      </Tooltip>
      <Box visibleFrom="sm">
        <UserMenu />
      </Box>
    </Group>
  )
}
