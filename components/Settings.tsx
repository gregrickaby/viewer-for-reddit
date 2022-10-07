import {
  Button,
  createStyles,
  Group,
  Modal,
  Switch,
  useMantineColorScheme
} from '@mantine/core'
import {IconSettings} from '@tabler/icons'
import {useState} from 'react'
import {useRedditContext} from '~/components/RedditProvider'

const useStyles = createStyles(() => ({
  settings: {},
  swtich: {
    ':not(:last-of-type)': {
      marginBottom: '0.5rem'
    }
  }
}))

export default function Settings() {
  const {classes} = useStyles()
  const [opened, setOpened] = useState(false)
  const {colorScheme, toggleColorScheme} = useMantineColorScheme()
  const {blurNSFW, setBlurNSFW} = useRedditContext()

  return (
    <>
      <Modal onClose={() => setOpened(false)} opened={opened} title="Settings">
        <Switch
          aria-label="Toggle between light and dark theme."
          label="Toggle Dark Theme (⌘+J)"
          checked={colorScheme === 'dark'}
          offLabel="OFF"
          onChange={() => toggleColorScheme()}
          onLabel="ON"
          size="lg"
          className={classes.swtich}
        />
        <Switch
          aria-label="Blue NSFW images."
          label="Blur NSFW images."
          checked={blurNSFW}
          offLabel="OFF"
          onChange={(event) => setBlurNSFW(event.currentTarget.checked)}
          onLabel="ON"
          size="lg"
          className={classes.swtich}
        />
      </Modal>

      <Group className={classes.settings}>
        <Button
          aria-label="open settings"
          color="gray"
          onClick={() => setOpened(true)}
          variant="subtle"
        >
          <IconSettings />
        </Button>
      </Group>
    </>
  )
}
