// New comments are rendered by `pollThreadLive` after the page loads, so their card styles
// have to ship with the page instead.
import '@/components/feed/comment-card.module.css'

import type { Route } from 'next'
import Link from 'next/link'

import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { PostCard, PostCardSkeleton } from '@/components/feed/post-card'
import { CommentComposer } from '@/components/islands/comment-composer'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import { LiveComments, LiveCount, LiveThread } from '@/components/islands/live-thread'
import { ContentReveal } from '@/components/motion/transitions'
import { getUsername } from '@/lib/auth/session'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getThread } from '@/lib/reddit/thread'
import { bodyHashOf, cursorFromTree, WATCH_WINDOW_SECONDS } from '@/lib/reddit/thread-live'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import { COMMENT_SORTS, parseThreadQuery, threadSortHref, type CommentSort } from '@/lib/url-state'
import type { ThreadView } from '@/lib/view-models'

import { CommentTree, CommentTreeSkeleton } from './comment-tree'
import styles from './thread.module.css'

const SORT_LABELS: Record<CommentSort, string> = {
  confidence: 'Best',
  top: 'Top',
  new: 'New',
  controversial: 'Controversial',
  old: 'Old',
  qa: 'Q&A',
}

export interface ThreadSectionProps {
  params: Promise<{ subreddit: string; id: string; rest?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * The post and its comments. One Reddit call feeds
 * both, so they share one Suspense boundary.
 */
export async function ThreadSection({ params, searchParams }: ThreadSectionProps) {
  const [{ id, rest }, search] = await Promise.all([params, searchParams])
  const query = parseThreadQuery(search)

  let thread: ThreadView
  try {
    thread = await getThread({ id, query, focusCommentId: rest?.[1] ?? null })
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  const [{ blurNsfw }, now, me] = await Promise.all([getSettings(), requestTime(), getUsername()])

  const { post, comments, focusCommentId, sort: current } = thread
  const defaultSort = post.suggestedSort ?? 'confidence'
  const readOnly = post.flags.locked || post.flags.archived
  const threadBase = focusCommentId ? `${post.permalink}/${focusCommentId}` : post.permalink
  // New comments only make sense in the order they arrive, and only on a thread still moving.
  const watching =
    current === 'new' &&
    !readOnly &&
    !focusCommentId &&
    now / 1000 - post.createdUtc < WATCH_WINDOW_SECONDS

  const content = (
    <>
      <nav aria-label="Breadcrumb">
        <Link
          className={styles.breadcrumb}
          href={`/r/${post.subreddit}` as Route}
          transitionTypes={['nav-back']}
        >
          ← r/{post.subreddit}
        </Link>
      </nav>

      <PostCard blurNsfw={blurNsfw} now={now} post={post} showSubreddit={false} variant="detail" />

      {readOnly ? (
        <p className={styles.banner} role="status">
          {post.flags.archived
            ? "This thread is archived. New comments and votes can't be posted."
            : "Comments are locked. New comments can't be posted."}
        </p>
      ) : null}

      {focusCommentId ? (
        <p className={styles.banner} role="status">
          You&apos;re viewing a single comment thread.{' '}
          <Link href={post.permalink as Route} transitionTypes={['nav-back']}>
            View all comments →
          </Link>
        </p>
      ) : null}

      <section aria-labelledby="comments-heading" className={styles.comments} id="comments">
        <div className={styles.toolbar}>
          <h2 className={styles.heading} id="comments-heading">
            <LiveCount initial={post.numComments} noun="comment" />
          </h2>
          <nav aria-label="Sort comments" className={styles.tabs}>
            {COMMENT_SORTS.map((sort) => (
              <Link
                aria-current={sort === current ? 'page' : undefined}
                className={styles.tab}
                href={threadSortHref(threadBase, sort, defaultSort) as Route}
                key={sort}
                scroll={false}
              >
                {SORT_LABELS[sort]}
                <LinkPendingHint />
              </Link>
            ))}
          </nav>
        </div>

        {readOnly || !me ? null : (
          <CommentComposer label="Comment" me={me} mode="reply" parent={post.fullname} />
        )}

        {watching ? <LiveComments /> : null}

        <ContentReveal contentKey={current} name="comment-tree">
          <div className={styles.tree}>
            {comments.length > 0 ? (
              <CommentTree
                ctx={{
                  postPath: post.permalink,
                  threadBase,
                  query,
                  now,
                  me: me ?? '',
                  readOnly,
                  focusCommentId,
                }}
                nodes={comments}
              />
            ) : (
              <p className={styles.empty}>No comments yet. Start the conversation.</p>
            )}
          </div>
        </ContentReveal>
      </section>
    </>
  )

  return watching ? (
    <LiveThread bodyHash={bodyHashOf(post.body)} cursor={cursorFromTree(comments)} id={post.id}>
      {content}
    </LiveThread>
  ) : (
    content
  )
}

export function ThreadSkeleton() {
  return (
    <div className={styles.skeleton}>
      <span aria-hidden="true" className={`skeleton ${styles.breadcrumbSkeleton}`} />
      <PostCardSkeleton />
      <CommentTreeSkeleton />
    </div>
  )
}
