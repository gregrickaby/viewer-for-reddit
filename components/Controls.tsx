'use client'

import { setCurrentSubreddit, toggleMute } from '@/lib/features/settingsSlice'
import {
  toggleFavorites,
  toggleRecent,
  toggleSearch,
  toggleSettings
} from '@/lib/features/transientSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import {
  IconFlame,
  IconHeart,
  IconHistory,
  IconHome,
  IconSearch,
  IconSettings,
  IconVolume,
  IconVolumeOff
} from '@tabler/icons-react'
import { useCallback } from 'react'
import { Tooltip } from './Tooltip'

/**
 * Controls component.
 */
export function Controls() {
  // Get dispatch function.
  const dispatch = useAppDispatch()

  // Get mute state.
  const mute = useAppSelector((state) => state.settings.isMuted)

  // Handle subreddit change.
  const handleClick = useCallback(
    (sub: string) => {
      dispatch(setCurrentSubreddit(sub))
    },
    [dispatch]
  )

  // Common button styles.
  const buttonStyles =
    'rounded-xl bg-white/50 dark:bg-black/70 p-1.5 text-black dark:text-white hover:scale-110 hover:box-shadow-lg hover:cursor-pointer'

  return (
    <div className="fixed right-3 bottom-18 z-[100] transition-opacity duration-200 lg:right-10">
      <div className="flex flex-col items-center gap-6">
        {/* Home button. */}
        <Tooltip label="r/all">
          <button
            aria-label="show all posts"
            className={buttonStyles}
            onClick={() => handleClick('all')}
          >
            <IconHome size={34} />
          </button>
        </Tooltip>

        {/* Popular button. */}
        <Tooltip label="r/popular">
          <button
            aria-label="show popular posts"
            className={buttonStyles}
            onClick={() => handleClick('popular')}
          >
            <IconFlame size={34} />
          </button>
        </Tooltip>

        {/* Search button. */}
        <Tooltip label="Search">
          <button
            aria-label="view search"
            className={buttonStyles}
            onClick={() => dispatch(toggleSearch())}
          >
            <IconSearch size={34} />
          </button>
        </Tooltip>

        {/* Favorites button. */}
        <Tooltip label="Favorite Subreddits">
          <button
            aria-label="favorite subreddits"
            className={buttonStyles}
            onClick={() => dispatch(toggleFavorites())}
          >
            <IconHeart size={34} />
          </button>
        </Tooltip>

        {/* Recent button. */}
        <Tooltip label="Viewing History">
          <button
            aria-label="viewing history"
            className={buttonStyles}
            onClick={() => dispatch(toggleRecent())}
          >
            <IconHistory size={34} />
          </button>
        </Tooltip>

        {/* Settings button. */}
        <Tooltip label="Settings">
          <button
            aria-label="view settings"
            className={buttonStyles}
            onClick={() => dispatch(toggleSettings())}
          >
            <IconSettings size={34} />
          </button>
        </Tooltip>

        {/* Mute button. */}
        <Tooltip label={mute ? 'Unmute' : 'Mute'}>
          <button
            aria-label={mute ? 'unmute audio' : 'mute audio'}
            className={buttonStyles}
            onClick={() => dispatch(toggleMute())}
          >
            {mute ? <IconVolumeOff size={34} /> : <IconVolume size={34} />}
          </button>
        </Tooltip>

        {/* Divider */}
        <div className="py-8"></div>
      </div>
    </div>
  )
}
