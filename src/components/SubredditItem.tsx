import { useCallback } from 'react'
import { IconReddit } from '../icons/Reddit'
import {
  addRecentSubreddit,
  closeAllModals,
  setCurrentSubreddit
} from '../store/features/settingsSlice'
import { useAppDispatch } from '../store/hooks'
import type { RedditSubreddit } from '../types/reddit'
import { formatNumber } from '../utils/numbers'

/**
 * SubredditItem component props.
 */
interface SubredditItemProps {
  /* Subreddit to display. */
  subreddit: RedditSubreddit
  /* Whether to close the search on select. */
  closeSearchOnSelect?: boolean
}

/**
 * SubredditItem component.
 */
export function SubredditItem({
  subreddit,
  closeSearchOnSelect = true
}: Readonly<SubredditItemProps>) {
  // Get the dispatch function.
  const dispatch = useAppDispatch()

  /**
   * Handles the subreddit selection.
   */
  const handleSelect = useCallback(() => {
    // Add the subreddit to the recent subreddits list in the store.
    dispatch(
      addRecentSubreddit({
        display_name: subreddit.display_name,
        icon_img: subreddit.icon_img ?? '',
        id: subreddit.id,
        over18: subreddit.over18,
        public_description: subreddit.public_description,
        subscribers: subreddit.subscribers
      })
    )

    // Set the current subreddit.
    dispatch(setCurrentSubreddit(subreddit.display_name))

    // Close the search if needed.
    if (closeSearchOnSelect) {
      dispatch(closeAllModals())
    }
  }, [dispatch, subreddit, closeSearchOnSelect])

  return (
    <button
      className="flex w-full items-center rounded p-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700"
      onClick={handleSelect}
    >
      <div className="mr-2 flex-shrink-0">
        {subreddit.icon_img ? (
          <img
            src={subreddit.icon_img}
            alt={`r/${subreddit.display_name} icon`}
            className="h-6 w-6 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <IconReddit />
        )}
      </div>
      <div className="flex flex-1 items-center overflow-hidden">
        <span className="truncate dark:text-white">
          r/{subreddit.display_name}
        </span>
        <span className="ml-2 flex-shrink-0 text-sm text-zinc-500">
          {formatNumber(subreddit.subscribers)}
        </span>
      </div>
    </button>
  )
}
