'use server'

import { type ReactNode, ViewTransition } from 'react'
import * as z from 'zod'
import type { ActionResult } from '@/lib/actions/result'
import { invalid, runAction } from '@/lib/actions/run-action'
import { CommentCard } from '@/components/feed/comment-card'
import { PostBody, revealReason } from '@/components/feed/post-card'
import { pollThread } from '@/lib/reddit/thread-live'
import { getSettings } from '@/lib/settings'

const Request = z.object({
  id: z.string().regex(/^[a-z0-9]{1,12}$/),
  cursor: z.object({
    since: z.number().int().min(0),
    // The ids sharing the newest second: a handful, never a page.
    seen: z.array(z.string().regex(/^[a-z0-9]{1,12}$/)).max(100),
  }),
  bodyHash: z.string().max(32),
})

/** One new comment, rendered, with when it was posted so the island can pace it. */
export type LiveItem = { id: string; createdUtc: number; node: ReactNode }

export type ThreadPollResult = {
  /** Newest first. */
  items: LiveItem[]
  cursor: { since: number; seen: string[] }
  bodyHash: string
  /** Set only when the post's body changed since `bodyHash`. */
  body: { node: ReactNode } | null
  numComments: number
}

/**
 * New comments and the post's current body, rendered on the server. The thread
 * island calls this on a timer, so the browser never sees Reddit's JSON.
 */
export async function pollThreadLive(input: unknown): Promise<ActionResult<ThreadPollResult>> {
  const parsed = Request.safeParse(input)
  if (!parsed.success) return invalid()
  const { id, cursor, bodyHash } = parsed.data

  return runAction(async () => {
    const [poll, { blurNsfw }] = await Promise.all([pollThread(id, cursor), getSettings()])
    const now = Date.now()
    const changed = poll.bodyHash !== bodyHash
    return {
      items: poll.comments.map(({ comment, replyTo }) => ({
        id: comment.id,
        createdUtc: comment.createdUtc,
        node: (
          <ViewTransition enter="slide-up" default="none">
            <li>
              <CommentCard comment={comment} now={now} replyTo={replyTo} />
            </li>
          </ViewTransition>
        ),
      })),
      cursor: poll.cursor,
      bodyHash: poll.bodyHash,
      body: changed
        ? {
            node: poll.post.body ? (
              <PostBody
                html={poll.post.body}
                excerpt={false}
                reveal={revealReason(poll.post, blurNsfw)}
              />
            ) : null,
          }
        : null,
      numComments: poll.post.numComments,
    }
  })
}
