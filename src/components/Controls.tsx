import { useCallback } from 'react'
import { IconComments } from '../icons/Comments'
import { IconHistory } from '../icons/History'
import { IconHome } from '../icons/Home'
import { IconMute } from '../icons/Mute'
import { IconSearch } from '../icons/Search'
import { IconSettings } from '../icons/Settings'
import { IconSpeaker } from '../icons/Speaker'
import { IconUp } from '../icons/Up'
import {
  setCurrentSubreddit,
  toggleAppLoading,
  toggleMute,
  toggleRecent,
  toggleSearch,
  toggleSettings
} from '../store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { publicApi } from '../store/services/publicApi'
import type { RedditPost } from '../types/reddit'
import { formatNumber } from '../utils/numbers'
import { Tooltip } from './Tooltip'

/**
 * ControlsProps interface.
 */
interface ControlsProps {
  /* Required. Reddit post data */
  post: RedditPost
  /* Optional. Is current post */
  isCurrent?: boolean
}

/**
 * Controls Component.
 *
 * @param {RedditPost} post - Reddit post data
 */
export function Controls({ post, isCurrent = false }: Readonly<ControlsProps>) {
  // Get dispatch function.
  const dispatch = useAppDispatch()

  // Get mute state.
  const mute = useAppSelector((state) => state.settings.isMuted)

  // Construct the post URL for external links.
  const postUrl = `https://reddit.com${post.permalink}`

  /**
   * Home button handler.
   * Dispatches actions to toggle the loading state and set the current subreddit to popular.
   * Uses delays to ensure smooth transitions.
   */
  const handleHome = useCallback(() => {
    // Show loading state immediately.
    dispatch(toggleAppLoading())
    // Switch to popular.
    dispatch(setCurrentSubreddit('all'))
    // Reset API state after a short delay.
    setTimeout(() => {
      dispatch(publicApi.util.resetApiState())
      // Hide loading state after another delay.
      setTimeout(() => {
        dispatch(toggleAppLoading())
      }, 500)
    }, 300)
  }, [dispatch])

  // Common button styles.
  const buttonStyles =
    'transition-all hover:scale-110 text-center text-white hover:text-white/90 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]'

  return (
    <div
      className={`fixed right-0 bottom-5 z-[100] transition-opacity duration-200 lg:right-10 ${
        isCurrent
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="flex min-w-22 flex-col items-center gap-6 p-4">
        {/* Home button. */}
        <Tooltip label="r/all">
          <button
            aria-label="show all posts"
            className={buttonStyles}
            onClick={handleHome}
          >
            <IconHome />
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

        {/* Recent button. */}
        <Tooltip label="Recent Searches">
          <button
            aria-label="view recent searches"
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
        <div></div>

        {/* Upvotes button. */}
        <Tooltip label="Upvotes">
          <button
            aria-label="view post on reddit.com"
            className={`flex flex-col items-center gap-1 ${buttonStyles}`}
            onClick={() => window.open(postUrl, '_blank')}
          >
            <IconUp />
            <span className="text-sm">{formatNumber(post.ups)}</span>
          </button>
        </Tooltip>

        {/* Comments button. */}
        <Tooltip label="Comments">
          <button
            aria-label="view comments on reddit.com"
            className={`flex flex-col items-center gap-1 ${buttonStyles}`}
            onClick={() => window.open(postUrl, '_blank')}
          >
            <IconComments />
            <span className="text-sm">{formatNumber(post.num_comments)}</span>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
