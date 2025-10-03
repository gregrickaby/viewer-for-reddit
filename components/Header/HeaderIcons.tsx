import {UserMenu} from '@/components/Auth/UserMenu'
import {Settings} from '@/components/Settings/Settings'
import config from '@/lib/config'
import {ActionIcon, Group, Tooltip} from '@mantine/core'
import {FaGithub} from 'react-icons/fa'
import {SiBuymeacoffee} from 'react-icons/si'

export function HeaderIcons() {
  return (
    <Group gap="xs">
      <Settings />
      <Tooltip label="View source code" position="bottom" withArrow>
        <ActionIcon
          aria-label="View source code"
          color="gray"
          component="a"
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
      <UserMenu />
    </Group>
  )
}
