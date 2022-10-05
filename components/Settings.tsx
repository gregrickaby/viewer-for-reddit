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

const useStyles = createStyles(() => ({
  settings: {}
}))

export default function Settings() {
  const {classes} = useStyles()
  const [opened, setOpened] = useState(false)
  const {colorScheme, toggleColorScheme} = useMantineColorScheme()

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
