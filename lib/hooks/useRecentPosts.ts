'use client'

import type {RedditPost} from '@/lib/types/reddit'
import {useLocalStorage} from '@mantine/hooks'

/**
 * A lightweight snapshot of a visited post, captured at visit time and
 * stored in the Recent Posts rail. Not kept in sync with the post's live
 * score/comment count.
 */
export interface RecentPostEntry {
  id: string
  subreddit: string
  subredditPrefixed: string
  title: string
  author: string
  permalink: string
  thumbnail?: string
  score: number
  numComments: number
  /** Unix timestamp in seconds, when the post was last visited. */
  visitedAt: number
}

const STORAGE_KEY = 'viewer-recent-posts'
const MAX_RECENT_POSTS = 10

/**
 * Tracks recently visited post permalinks in `localStorage`, synced across
 * browser tabs via `@mantine/hooks`' `useLocalStorage`. Revisiting a post
 * moves its existing entry to the top instead of duplicating it; the list
 * caps at {@link MAX_RECENT_POSTS} entries, dropping the oldest.
 */
export function useRecentPosts(): {
  recentPosts: RecentPostEntry[]
  addRecentPost: (post: RedditPost) => void
  clearRecentPosts: () => void
} {
  const [recentPosts, setRecentPosts, clearRecentPosts] = useLocalStorage<
    RecentPostEntry[]
  >({
    key: STORAGE_KEY,
    defaultValue: []
  })

  function addRecentPost(post: RedditPost) {
    setRecentPosts((current) => {
      const withoutExisting = current.filter((entry) => entry.id !== post.id)
      const entry: RecentPostEntry = {
        id: post.id,
        subreddit: post.subreddit,
        subredditPrefixed: post.subreddit_name_prefixed,
        title: post.title,
        author: post.author,
        permalink: post.permalink,
        thumbnail: post.thumbnail,
        score: post.score,
        numComments: post.num_comments,
        visitedAt: Math.floor(Date.now() / 1000)
      }
      return [entry, ...withoutExisting].slice(0, MAX_RECENT_POSTS)
    })
  }

  return {recentPosts, addRecentPost, clearRecentPosts}
}
