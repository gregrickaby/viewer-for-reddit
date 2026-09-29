import type { Route } from 'next'
import Link from 'next/link'
import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { PostCard, PostCardSkeleton } from '@/components/feed/post-card'
import { CommentComposer } from '@/components/islands/comment-composer'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import { ContentReveal } from '@/components/motion/transitions'
import { getUsername } from '@/lib/auth/session'
import { plural } from '@/lib/format'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getThread } from '@/lib/reddit/thread'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import { COMMENT_SORTS, type CommentSort, parseThreadQuery, threadSortHref } from '@/lib/url-state'
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

export type ThreadSectionProps = {
  params: Promise<{ subreddit: string; id: string; rest?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * The post and its comments (implementation §4.2). One Reddit call feeds
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

  const { post, comments, focusCommentId } = thread
  const readOnly = post.flags.locked || post.flags.archived
  const threadBase = focusCommentId ? `${post.permalink}/${focusCommentId}` : post.permalink

  return (
    <>
      <nav aria-label="Breadcrumb">
        <Link
          href={`/r/${post.subreddit}` as Route}
          className={styles.breadcrumb}
          transitionTypes={['nav-back']}
        >
          ← r/{post.subreddit}
        </Link>
      </nav>

      <PostCard post={post} showSubreddit={false} blurNsfw={blurNsfw} now={now} variant="detail" />

      {readOnly ? (
        <p className={styles.banner} role="status">
          {post.flags.archived
            ? 'This thread is archived. New comments and votes can’t be posted.'
            : 'Comments are locked. New comments can’t be posted.'}
        </p>
      ) : null}

      {focusCommentId ? (
        <p className={styles.banner} role="status">
          You’re viewing a single comment thread.{' '}
          <Link href={post.permalink as Route} transitionTypes={['nav-back']}>
            View all comments →
          </Link>
        </p>
      ) : null}

      <section id="comments" className={styles.comments} aria-labelledby="comments-heading">
        <div className={styles.toolbar}>
          <h2 id="comments-heading" className={styles.heading}>
            {plural(post.numComments, 'comment')}
          </h2>
          <nav aria-label="Sort comments" className={styles.tabs}>
            {COMMENT_SORTS.map((sort) => (
              <Link
                key={sort}
                href={threadSortHref(threadBase, sort) as Route}
                className={styles.tab}
                aria-current={sort === query.sort ? 'page' : undefined}
                scroll={false}
              >
                {SORT_LABELS[sort]}
                <LinkPendingHint />
              </Link>
            ))}
          </nav>
        </div>

        {readOnly || !me ? null : (
          <CommentComposer mode="reply" parent={post.fullname} me={me} label="Comment" />
        )}

        <ContentReveal name="comment-tree" contentKey={query.sort}>
          <div className={styles.tree}>
            {comments.length > 0 ? (
              <CommentTree
                nodes={comments}
                ctx={{
                  postPath: post.permalink,
                  threadBase,
                  query,
                  now,
                  me: me ?? '',
                  readOnly,
                  focusCommentId,
                }}
              />
            ) : (
              <p className={styles.empty}>No comments yet. Start the conversation.</p>
            )}
          </div>
        </ContentReveal>
      </section>
    </>
  )
}

export function ThreadSkeleton() {
  return (
    <div className={styles.skeleton}>
      <span className={`skeleton ${styles.breadcrumbSkeleton}`} aria-hidden="true" />
      <PostCardSkeleton />
      <CommentTreeSkeleton />
    </div>
  )
}
