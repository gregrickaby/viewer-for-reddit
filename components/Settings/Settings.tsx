'use client'

import {
  clearFavorites,
  clearRecent,
  resetSettings,
  toggleMute,
  toggleNsfw
} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {
  ActionIcon,
  Menu,
  Switch,
  Tooltip,
  useMantineColorScheme
} from '@mantine/core'
import {showNotification} from '@mantine/notifications'
import {FaCog, FaTrashAlt} from 'react-icons/fa'
import {GoBookmarkSlashFill} from 'react-icons/go'
import {TbArticleOff} from 'react-icons/tb'

export function Settings() {
  const dispatch = useAppDispatch()
  const {colorScheme, setColorScheme} = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const nsfw = useAppSelector((state) => state.settings.enableNsfw)
  const isMuted = useAppSelector((state) => state.settings.isMuted)

  return (
    <Menu position="bottom-end" shadow="md" width={220} withArrow zIndex={999}>
      <Menu.Target>
        <Tooltip label="View settings" position="bottom" withArrow>
          <ActionIcon
            aria-label="Settings"
            color="gray"
            size="xl"
            variant="light"
          >
            <FaCog size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Preferences</Menu.Label>

        <Menu.Item closeMenuOnClick={false}>
          <Switch
            label="Enable NSFW"
            checked={nsfw}
            onChange={() => dispatch(toggleNsfw())}
          />
        </Menu.Item>

        <Menu.Item closeMenuOnClick={false}>
          <Switch
            label="Dark Mode"
            checked={isDark}
            onChange={(e) =>
              setColorScheme(e.currentTarget.checked ? 'dark' : 'light')
            }
          />
        </Menu.Item>

        <Menu.Item closeMenuOnClick={false}>
          <Switch
            label="Mute"
            checked={isMuted}
            onChange={() => dispatch(toggleMute())}
          />
        </Menu.Item>

        <Menu.Divider />
        <Menu.Label>Viewing History and Favorites</Menu.Label>

        <Menu.Item
          onClick={() => {
            dispatch(clearRecent())
            showNotification({
              title: 'Success',
              message: 'All recent viewing history has been removed.',
              color: 'green'
            })
          }}
        >
          <TbArticleOff style={{marginRight: '8px'}} />
          Delete Recently Viewed
        </Menu.Item>

        <Menu.Item
          onClick={() => {
            dispatch(clearFavorites())
            showNotification({
              title: 'Success',
              message:
                'All favorites have been removed. You can always add them again.',
              color: 'green'
            })
          }}
        >
          <GoBookmarkSlashFill style={{marginRight: '8px'}} />
          Delete All Favorites
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Danger Zone</Menu.Label>

        <Tooltip
          label="This will delete all settings, recent viewing history, and favorites. This action cannot be undone!"
          position="bottom"
        >
          <Menu.Item
            color="red"
            onClick={() => {
              dispatch(resetSettings())
              showNotification({
                title: 'Success',
                message:
                  'All settings, history, and favorites have been removed.',
                color: 'green'
              })
            }}
          >
            <FaTrashAlt style={{marginRight: '8px'}} />
            Reset All
          </Menu.Item>
        </Tooltip>
      </Menu.Dropdown>
    </Menu>
  )
}
