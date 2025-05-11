import config from '@/lib/config'
import {Center, Text} from '@mantine/core'

export function Footer() {
  return (
    <Center>
      <Text size="sm">
        Built and maintained by{' '}
        <a
          aria-label={`Visit ${config.siteAuthor}'s website`}
          href={config.authorUrl}
          rel="author noreferrer"
          target="_blank"
        >
          {config.siteAuthor}
        </a>
      </Text>
    </Center>
  )
}
