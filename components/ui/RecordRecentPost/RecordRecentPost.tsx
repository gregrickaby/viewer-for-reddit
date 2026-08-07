'use client'

import {useRecentPosts} from '@/lib/hooks/useRecentPosts'
import type {RedditPost} from '@/lib/types/reddit'
import {useEffect, useRef} from 'react'

interface RecordRecentPostProps {
  /** The visited post to record in the Recent Posts rail. */
  post: RedditPost
}

/**
 * Records a post visit to the Recent Posts rail on mount. Renders nothing --
 * this is a side-effect-only component, meant to sit alongside `PostCard` on
 * a post's permalink page.
 *
 * Keys the effect on `post.id` alone: `addRecentPost` re-records the visit
 * with a fresh timestamp every time it's called, so depending on the
 * `post`/`addRecentPost` object and function references (both of which
 * change identity on every `useRecentPosts` re-render, since a recorded
 * visit updates that same hook's state) causes the effect to refire in a
 * loop, continuously bumping `visitedAt` to "now".
 */
export function RecordRecentPost({post}: Readonly<RecordRecentPostProps>) {
  const {addRecentPost} = useRecentPosts()
  const postRef = useRef(post)
  postRef.current = post
  const addRecentPostRef = useRef(addRecentPost)
  addRecentPostRef.current = addRecentPost

  useEffect(() => {
    addRecentPostRef.current(postRef.current)
  }, [post.id])

  return null
}
