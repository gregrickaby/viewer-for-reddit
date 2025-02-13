import { useCallback } from 'react'
import { IconHeart } from '../icons/Heart'
import { IconHistory } from '../icons/History'
import { IconHome } from '../icons/Home'
import { IconMute } from '../icons/Mute'
import { IconPopular } from '../icons/Popular'
import { IconSearch } from '../icons/Search'
import { IconSettings } from '../icons/Settings'
import { IconSpeaker } from '../icons/Speaker'
import {
  setCurrentSubreddit,
  toggleAppLoading,
  toggleFavorites,
  toggleMute,
  toggleRecent,
  toggleSearch,
  toggleSettings
} from '../store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { publicApi } from '../store/services/publicApi'
import { Tooltip } from './Tooltip'

/**
 * Controls Component.
 *
 * @param {RedditPost} post - Reddit post data
 */
export function Controls() {
  // Get dispatch function.
  const dispatch = useAppDispatch()

  // Get mute state.
  const mute = useAppSelector((state) => state.settings.isMuted)

  /**
   * Home button handler.
   * Dispatches actions to toggle the loading state and set the current subreddit to popular.
   * Uses delays to ensure smooth transitions.
   */
  const handleClick = useCallback(
    (sub: string) => {
      // Show loading state immediately.
      dispatch(toggleAppLoading())
      // Switch to popular.
      dispatch(setCurrentSubreddit(sub))
      // Reset API state after a short delay.
      setTimeout(() => {
        dispatch(publicApi.util.resetApiState())
        // Hide loading state after another delay.
        setTimeout(() => {
          dispatch(toggleAppLoading())
        }, 500)
      }, 300)
    },
    [dispatch]
  )

  // Common button styles.
  const buttonStyles =
    'rounded-xl bg-white/50 dark:bg-black/70 p-1.5 text-black dark:text-white hover:scale-110 hover:box-shadow-lg'

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
            <IconHome />
          </button>
        </Tooltip>

        {/* Popular button. */}
        <Tooltip label="r/popular">
          <button
            aria-label="show popular posts"
            className={buttonStyles}
            onClick={() => handleClick('popular')}
          >
            <IconPopular />
          </button>
        </Tooltip>

        {/* Search button. */}
        <Tooltip label="Search">
          <button
            aria-label="view search"
            className={buttonStyles}
            onClick={() => dispatch(toggleSearch())}
          >
            <IconSearch />
          </button>
        </Tooltip>

        {/* Favorites button. */}
        <Tooltip label="Favorite Subreddits">
          <button
            aria-label="favorite subreddits"
            className={buttonStyles}
            onClick={() => dispatch(toggleFavorites())}
          >
            <IconHeart height={34} width={34} />
          </button>
        </Tooltip>

        {/* Recent button. */}
        <Tooltip label="Viewing History">
          <button
            aria-label="viewing history"
            className={buttonStyles}
            onClick={() => dispatch(toggleRecent())}
          >
            <IconHistory />
          </button>
        </Tooltip>

        {/* Settings button. */}
        <Tooltip label="Settings">
          <button
            aria-label="view settings"
            className={buttonStyles}
            onClick={() => dispatch(toggleSettings())}
          >
            <IconSettings />
          </button>
        </Tooltip>

        {/* Mute button. */}
        <Tooltip label={mute ? 'Unmute' : 'Mute'}>
          <button
            aria-label={mute ? 'unmute audio' : 'mute audio'}
            className={buttonStyles}
            onClick={() => dispatch(toggleMute())}
          >
            {mute ? <IconMute /> : <IconSpeaker />}
          </button>
        </Tooltip>

        {/* Divider */}
        <div className="py-8"></div>
      </div>
    </div>
  )
}
