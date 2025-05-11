import config from '@/lib/config'
import {ActionIcon, Tooltip} from '@mantine/core'
import {FaGithub} from 'react-icons/fa'
import {SiBuymeacoffee} from 'react-icons/si'

export function Icons() {
  return (
    <>
      <Tooltip label="View source code" position="bottom" withArrow>
        <ActionIcon
          aria-label="View source code"
          color="gray"
          component="a"
          href={config.githubUrl}
          rel="noopener noreferrer"
          size="lg"
          target="_blank"
          variant="light"
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
          size="lg"
          target="_blank"
          variant="light"
        >
          <SiBuymeacoffee size={18} />
        </ActionIcon>
      </Tooltip>
    </>
  )
}
