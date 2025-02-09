import { memo, useCallback } from 'react'
import { IconReddit } from '../icons/Reddit'
import { IconUser } from '../icons/User'
import type { RedditChild } from '../types/reddit'
import { formatTimeAgo } from '../utils/numbers'
import { sanitizeText } from '../utils/sanitizeText'
import { Controls } from './Controls'
import { Media } from './Media'

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
 * @param {(node?: Element | null) => void} [props.observerRef] - Callback ref for intersection observer.
 * @param {boolean} [props.isCurrent=false] - Indicates if the post is currently in view.
 */
export const Post = memo(function Post({
  post,
  observerRef,
  isCurrent = false
}: Readonly<PostProps>) {
  const setRef = useCallback(
    (node: Element | null) => {
      if (observerRef) observerRef(node)
    },
    [observerRef]
  )

  return (
    <article
      ref={setRef}
      data-post-id={post.data.id}
      className="relative flex h-[100dvh] w-full min-w-[400px] snap-start items-center justify-center"
    >
      <div className="relative flex h-full min-w-[400px] items-center justify-center">
        {/* Media content */}
        <div className="relative h-full w-full min-w-[400px]">
          <Media post={post.data} />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Post Meta */}
        <div className="absolute right-0 bottom-5 left-0 z-20 flex w-9/12 flex-col gap-2 p-4 text-white">
          <div className="flex items-center gap-1 pb-2 text-xs font-semibold">
            <IconReddit />
            {post.data.subreddit_name_prefixed}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <a
              className="flex items-center gap-1"
              href={`https://www.reddit.com/u/${sanitizeText(post.data.author)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconUser />
              {sanitizeText(post.data.author)}
            </a>
            <span>&middot;</span>
            <time>{formatTimeAgo(post.data.created_utc)}</time>
          </div>

          <h2 className="line-clamp-3 overflow-hidden text-ellipsis">
            <a
              className="text-xl font-bold"
              href={`https://reddit.com${post.data.permalink}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {sanitizeText(post.data.title || 'Untitled Post')}
            </a>
          </h2>
        </div>

        {/* Always show Controls */}
        <Controls post={post.data} isCurrent={isCurrent} />
      </div>
    </article>
  )
})
