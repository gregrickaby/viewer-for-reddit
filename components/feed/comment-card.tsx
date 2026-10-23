import type { Route } from 'next'
import Link from 'next/link'

import { LiveTime } from '@/components/islands/live-time'
import { SaveButton } from '@/components/islands/save-button'
import { VoteButtons } from '@/components/islands/vote-buttons'
import { RedditHtml } from '@/components/reddit-html'
import type { CommentView } from '@/lib/view-models'

import styles from './comment-card.module.css'

/**
 * A comment listed outside its thread (saved items, profiles): the post it
 * belongs to, the comment, and a link to see it in context.
 */
export function CommentCard({
  comment,
  now,
  replyTo,
}: {
  comment: CommentView
  now: number
  /** The author this comment answers, for comments shown out of place (a thread's live stream). */
  replyTo?: string | null
}) {
  const context = comment.context
  return (
    <article aria-label={`Comment by ${comment.author ?? '[deleted]'}`} className={styles.card}>
      <p className={styles.context}>
        {context ? (
          <>
            <Link
              className={styles.post}
              href={context.postPermalink as Route}
              transitionTypes={['nav-forward']}
            >
              {context.postTitle}
            </Link>
            {' · '}
            <Link href={`/r/${context.subreddit}` as Route} transitionTypes={['nav-forward']}>
              r/{context.subreddit}
            </Link>
          </>
        ) : null}
      </p>
      {replyTo ? <p className={styles.context}>Replying to u/{replyTo}</p> : null}
      <p className={styles.meta}>
        {comment.author ? (
          <Link href={`/user/${comment.author}` as Route} transitionTypes={['nav-forward']}>
            u/{comment.author}
          </Link>
        ) : (
          '[deleted]'
        )}
        <LiveTime now={now} utc={comment.createdUtc} />
      </p>
      {comment.body ? (
        <RedditHtml html={comment.body} />
      ) : (
        <p className={styles.removed}>
          {comment.removal === 'deleted' ? 'Deleted by its author.' : 'Removed.'}
        </p>
      )}
      <div className={styles.actions}>
        <VoteButtons
          disabled={comment.flags.archived || comment.removal !== null}
          fullname={comment.fullname}
          hideScore={comment.scoreHidden}
          key={`${comment.likes}:${comment.score}`}
          likes={comment.likes}
          noun="comment"
          score={comment.score}
        />
        <SaveButton fullname={comment.fullname} key={String(comment.saved)} saved={comment.saved} />
        <Link
          className={styles.action}
          href={comment.permalink as Route}
          transitionTypes={['nav-forward']}
        >
          View context
        </Link>
      </div>
    </article>
  )
}
