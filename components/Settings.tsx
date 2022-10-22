import {
  ActionIcon,
  createStyles,
  Modal,
  Switch,
  useMantineColorScheme
} from '@mantine/core'
import {IconSettings} from '@tabler/icons'
import {useState} from 'react'
import {useRedditContext} from '~/components/RedditProvider'

const useStyles = createStyles(() => ({
  swtich: {
    ':not(:last-of-type)': {
      marginBottom: '0.5rem'
    }
  }
}))

/**
 * Settings component.
 */
export default function Settings() {
  const {classes} = useStyles()
  const [opened, setOpened] = useState(false)
  const {colorScheme, toggleColorScheme} = useMantineColorScheme()
  const {blurNSFW, setBlurNSFW} = useRedditContext()

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
      <Modal onClose={() => setOpened(false)} opened={opened} title="Settings">
        <Switch
          aria-label="Toggle between light and dark theme."
          checked={colorScheme === 'dark'}
          className={classes.swtich}
          label="Toggle Dark Theme (⌘+J)"
          offLabel="OFF"
          onChange={() => toggleColorScheme()}
          onLabel="ON"
          size="lg"
        />
        <Switch
          aria-label="Blur NSFW images"
          checked={blurNSFW}
          className={classes.swtich}
          label="Blur NSFW images"
          offLabel="OFF"
          onChange={(event) => setBlurNSFW(event.currentTarget.checked)}
          onLabel="ON"
          size="lg"
        />
      </Modal>
    </>
  )
}
