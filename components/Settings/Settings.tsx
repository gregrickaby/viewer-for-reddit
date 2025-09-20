'use client'

import {
  clearFavorites,
  clearRecent,
  clearSearchHistory,
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
import {MdSearchOff} from 'react-icons/md'
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
            data-testid="settings-button"
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
            aria-label="Toggle NSFW"
            checked={nsfw}
            data-testid="nsfw-switch"
            label="Allow NSFW"
            onChange={() => dispatch(toggleNsfw())}
          />
        </Menu.Item>

        <Menu.Item closeMenuOnClick={false}>
          <Switch
            aria-label="Toggle Dark Mode"
            checked={isDark}
            data-testid="dark-mode-switch"
            label="Dark Mode"
            onChange={(e) =>
              setColorScheme(e.currentTarget.checked ? 'dark' : 'light')
            }
          />
        </Menu.Item>

        <Menu.Item closeMenuOnClick={false}>
          <Switch
            aria-label="Toggle Mute"
            checked={isMuted}
            data-testid="mute-switch"
            label="Mute"
            onChange={() => dispatch(toggleMute())}
          />
        </Menu.Item>

        <Menu.Divider />
        <Menu.Label>History and Favorites</Menu.Label>

        <Menu.Item
          data-testid="clear-search-history-button"
          onClick={() => {
            dispatch(clearSearchHistory())
            showNotification({
              title: 'Success',
              message: 'Search history has been removed.',
              color: 'green'
            })
          }}
        >
          <MdSearchOff style={{marginRight: '8px'}} />
          Clear Search History
        </Menu.Item>

        <Menu.Item
          data-testid="clear-recent-button"
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
          Clear Recently Viewed
        </Menu.Item>

        <Menu.Item
          data-testid="clear-favorites-button"
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
          Clear All Favorites
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Danger Zone</Menu.Label>

        <Tooltip
          label="This will clear all settings, recent viewing history, search history, and favorites. This action cannot be undone!"
          position="bottom"
        >
          <Menu.Item
            color="red"
            data-testid="reset-all-button"
            onClick={() => {
              dispatch(resetSettings())
              showNotification({
                title: 'Success',
                message:
                  'All settings, viewing & search history, and favorites have been removed.',
                color: 'green'
              })
            }}
          >
            <FaTrashAlt style={{marginRight: '8px'}} />
            Reset All Data
          </Menu.Item>
        </Tooltip>
      </Menu.Dropdown>
    </Menu>
  )
}
