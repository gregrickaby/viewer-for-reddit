'use client'

import {
  addRecentSubreddit,
  clearSingleFavorite,
  clearSingleRecent,
  setCurrentSubreddit
} from '@/lib/features/settingsSlice'
import { closeAllModals } from '@/lib/features/transientSlice'
import { useAppDispatch } from '@/lib/hooks'
import { formatNumber } from '@/lib/numbers'
import type { RedditSubreddit } from '@/types/reddit'
import { IconBrandReddit, IconTrash } from '@tabler/icons-react'
import { useCallback } from 'react'

/**
 * SubredditItem component props.
 */
interface SubredditItemProps {
  /* Subreddit to display. */
  subreddit: RedditSubreddit
  /* Whether to close the search on select. */
  closeOnSelect?: boolean
  /** The type of list this item is in */
  listType?: 'favorites' | 'recent' | 'search' | 'popular'
}

/**
 * SubredditItem component.
 */
export function SubredditItem({
  subreddit,
  closeOnSelect = true,
  listType = 'search'
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
    if (closeOnSelect) {
      dispatch(closeAllModals())
    }
  }, [dispatch, subreddit, closeOnSelect])

  /**
   * Handles the subreddit removal.
   */
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation() // Prevent triggering the select handler
      if (listType === 'favorites') {
        dispatch(clearSingleFavorite(subreddit.display_name))
      } else if (listType === 'recent') {
        dispatch(clearSingleRecent(subreddit.display_name))
      }
    },
    [dispatch, subreddit.display_name, listType]
  )

  const showRemoveButton = listType === 'favorites' || listType === 'recent'

  return (
    <div className="flex w-full items-center gap-4">
      <button
        aria-label={`navigate to r/${subreddit.display_name}`}
        className="flex w-full items-center rounded p-2 text-left hover:cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
        onClick={handleSelect}
      >
        {/* Display the subreddit icon or the default Reddit icon. */}
        <div className="mr-2 flex-shrink-0">
          {subreddit.icon_img ? (
            <img
              alt={`r/${subreddit.display_name} icon`}
              src={subreddit.icon_img}
              className="h-6 w-6 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <IconBrandReddit />
          )}
        </div>

        {/* Display the subreddit name and subscriber count. */}
        <div className="flex flex-1 items-center">
          <span>r/{subreddit.display_name}</span>
          <span className="ml-2 flex-shrink-0 text-sm text-zinc-500">
            {formatNumber(subreddit.subscribers)}
          </span>
        </div>
      </button>

      {/* Display the remove button if needed. */}
      {showRemoveButton && (
        <button
          aria-label={`Remove r/${subreddit.display_name} from ${listType}s`}
          onClick={handleRemove}
          className="hover:cursor-pointer"
        >
          <IconTrash size={18} />
        </button>
      )}
    </div>
  )
}
