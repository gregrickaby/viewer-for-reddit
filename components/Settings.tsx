import {
  ActionIcon,
  createStyles,
  Modal,
  Stack,
  Switch,
  useMantineColorScheme
} from '@mantine/core'
import {useDisclosure, useHotkeys} from '@mantine/hooks'
import {IconSettings} from '@tabler/icons-react'
import {useRedditContext} from '~/components/RedditProvider'
import Sort from '~/components/Sort'

const useStyles = createStyles((theme) => ({
  settings: {
    [`@media (max-width: ${theme.breakpoints.sm})`]: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md
    }
  }
}))

/**
 * Settings component.
 */
export default function Settings() {
  const [opened, {open, close}] = useDisclosure(false)
  const {colorScheme, toggleColorScheme} = useMantineColorScheme()
  const {blurNSFW, setBlurNSFW} = useRedditContext()
  const {classes} = useStyles()

  useHotkeys([['mod+b', () => setBlurNSFW(!blurNSFW)]])

  return (
    <>
      <ActionIcon
        aria-label="open settings"
        className={classes.settings}
        onClick={open}
        size="lg"
        variant="transparent"
      >
        <IconSettings size={48} />
      </ActionIcon>

      <Modal
        closeButtonProps={{'aria-label': 'close settings'}}
        onClose={close}
        opened={opened}
        padding="xl"
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
