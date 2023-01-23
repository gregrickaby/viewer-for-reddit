import {
  ActionIcon,
  Modal,
  Stack,
  Switch,
  useMantineColorScheme
} from '@mantine/core'
import {useHotkeys} from '@mantine/hooks'
import {IconSettings} from '@tabler/icons-react'
import {useState} from 'react'
import {useRedditContext} from '~/components/RedditProvider'
import Sort from '~/components/Sort'

/**
 * Settings component.
 */
export default function Settings() {
  const [opened, setOpened] = useState(false)
  const {colorScheme, toggleColorScheme} = useMantineColorScheme()
  const {blurNSFW, setBlurNSFW} = useRedditContext()

  useHotkeys([['mod+b', () => setBlurNSFW(!blurNSFW)]])

  return (
    <>
      <ActionIcon
        aria-label="open settings"
        onClick={() => setOpened(true)}
        size="lg"
        variant="transparent"
      >
        <IconSettings size={48} />
      </ActionIcon>

      <Modal
        closeButtonLabel="close settings"
        onClose={() => setOpened(false)}
        opened={opened}
        title="Settings"
      >
        <Stack justify="space-between">
          <Sort />
          <Switch
            aria-label="Toggle between light and dark theme."
            checked={colorScheme === 'dark'}
            label="Dark Theme (⌘+J)"
            offLabel="OFF"
            onChange={() => toggleColorScheme()}
            onLabel="ON"
            size="lg"
          />
          <Switch
            aria-label="Blur NSFW Media"
            checked={blurNSFW}
            label="Blur NSFW Media (⌘+B)"
            offLabel="OFF"
            onChange={(event) => setBlurNSFW(event.currentTarget.checked)}
            onLabel="ON"
            size="lg"
          />
        </Stack>
      </Modal>
    </>
  )
}
