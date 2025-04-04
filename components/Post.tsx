'use client'

import { Media, Tooltip } from '@/components'
import {
  addRecentSubreddit,
  setCurrentSubreddit,
  toggleFavoriteSubreddit
} from '@/lib/features/settingsSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { formatNumber, formatTimeAgo } from '@/lib/numbers'
import { sanitizeText } from '@/lib/sanitize'
import type { RedditChild } from '@/types/reddit'
import {
  IconArrowNarrowUp,
  IconBrandReddit,
  IconClockHour8,
  IconHeart,
  IconHeartFilled,
  IconMessage,
  IconUser
} from '@tabler/icons-react'
import { memo, useCallback } from 'react'

interface PostProps {
  /** Reddit post data. */
  post: RedditChild
  /** Callback ref for intersection observer. */
  observerRef?: (node?: Element | null) => void
  /** Indicates if the post is currently in view. */
  isCurrent?: boolean
}

/**
 * Renders a Reddit post as a full-screen card.
 *
 * Features:
 * - Supports image and video media.
 * - Displays title with a gradient overlay.
 * - Includes metadata (e.g., upvotes, comments).
 * - Uses intersection observer for lazy loading.
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders.
 * - Uses a stable ref callback for observer tracking.
 *
 * @param {PostProps} props - Component props.
 * @param {RedditChild} props.post - Reddit post data.
 * @param {boolean} [props.isCurrent=false] - Indicates if the post is currently in view.
 */
export const Post = memo(function Post({
  post,
  observerRef
}: Readonly<PostProps>) {
  // Get the dispatch function.
  const dispatch = useAppDispatch()

  // Add selector to check if subreddit is in favorites
  const isFavorite = useAppSelector((state) =>
    state.settings.favorites.some(
      (sub) => sub.display_name === post.data.subreddit
    )
  )

  // Set a ref for the current post.
  const setRef = useCallback(
    (node: Element | null) => {
      if (observerRef) observerRef(node)
    },
    [observerRef]
  )

  /**
   * Handle subreddit clicks.
   */
  const handleSubRedditClick = useCallback(() => {
    // Send the user to this subreddit.
    dispatch(setCurrentSubreddit(post.data.subreddit))

    // Update history.
    dispatch(
      addRecentSubreddit({
        display_name: post.data.subreddit,
        over18: post.data.over_18,
        subscribers: post.data.subreddit_subscribers
      })
    )
  }, [dispatch, post.data])

  /**
   * Handle toggling favorites.
   */
  const handleFavoriteClick = useCallback(() => {
    dispatch(
      toggleFavoriteSubreddit({
        display_name: post.data.subreddit,
        over18: post.data.over_18,
        subscribers: post.data.subreddit_subscribers
      })
    )
  }, [dispatch, post.data])

  return (
    <article
      className="relative flex h-[100dvh] w-full snap-start items-center justify-center"
      data-post-id={post.data.id}
      ref={setRef}
    >
      <div className="relative flex h-full items-center justify-center">
        {/* Media content */}
        <div className="relative h-full w-full min-w-[400px] lg:min-w-[600px]">
          <Media post={post.data} />
        </div>

        {/* Post Meta */}
        <div className="absolute right-0 bottom-0 z-20 flex min-h-48 w-full flex-col items-start justify-end gap-2 bg-gradient-to-t from-black/95 to-transparent p-6">
          <div className="flex flex-row gap-4">
            {/* Current Sub */}
            <button
              aria-label={`load posts from ${post.data.subreddit_name_prefixed}`}
              className="flex items-center gap-1 pb-3 text-xs font-semibold hover:cursor-pointer"
              onClick={handleSubRedditClick}
            >
              <IconBrandReddit size={16} />
              {post.data.subreddit_name_prefixed}
            </button>

            {/* Add to Favorite */}
            <button
              aria-label={`${isFavorite ? 'remove from' : 'add to'} favorites`}
              className="flex items-center gap-1 pb-3 text-xs font-semibold hover:cursor-pointer"
              onClick={handleFavoriteClick}
            >
              <Tooltip
                label={`${isFavorite ? 'Remove from' : 'Add to'} Favorites`}
              >
                {isFavorite ? (
                  <IconHeartFilled size={16} />
                ) : (
                  <IconHeart size={16} />
                )}
              </Tooltip>
            </button>
          </div>

          {/* Post Author */}
          <div className="flex items-center gap-1 text-xs">
            <a
              aria-label="view author profile"
              className="flex items-center gap-1"
              href={`https://www.reddit.com/u/${sanitizeText(post.data.author)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconUser size={16} />
              {sanitizeText(post.data.author)}
            </a>
            <span>&middot;</span>
            <time className="flex items-center gap-1">
              <IconClockHour8 size={16} />
              {formatTimeAgo(post.data.created_utc)}
            </time>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <IconMessage size={16} />
              {formatNumber(post.data.num_comments)}
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <IconArrowNarrowUp size={16} />
              {formatNumber(post.data.ups)}
            </span>
          </div>

          {/* Post Title */}
          <h2 className="max-w-70 overflow-hidden lg:max-w-full">
            <a
              aria-label="view post on reddit"
              className="line-clamp-5 text-xl leading-6 font-bold text-ellipsis"
              href={`https://reddit.com${post.data.permalink}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {sanitizeText(post.data.title || 'Untitled Post')}
            </a>
          </h2>
        </div>
      </div>
    </article>
  )
})
