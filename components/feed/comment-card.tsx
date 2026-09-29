import type { Route } from 'next'
import Link from 'next/link'
import { SaveButton } from '@/components/islands/save-button'
import { VoteButtons } from '@/components/islands/vote-buttons'
import { RedditHtml } from '@/components/reddit-html'
import { absoluteTime, isoTime, timeAgo } from '@/lib/format'
import type { CommentView } from '@/lib/view-models'
import styles from './comment-card.module.css'

/**
 * A comment listed outside its thread (saved items, profiles): the post it
 * belongs to, the comment, and a link to see it in context (design §10.2).
 */
export function CommentCard({ comment, now }: { comment: CommentView; now: number }) {
  const context = comment.context
  return (
    <article className={styles.card} aria-label={`Comment by ${comment.author ?? '[deleted]'}`}>
      <p className={styles.context}>
        {context ? (
          <>
            <Link
              href={context.postPermalink as Route}
              className={styles.post}
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
      <p className={styles.meta}>
        {comment.author ? (
          <Link href={`/user/${comment.author}` as Route} transitionTypes={['nav-forward']}>
            u/{comment.author}
          </Link>
        ) : (
          '[deleted]'
        )}
        <time dateTime={isoTime(comment.createdUtc)} title={absoluteTime(comment.createdUtc)}>
          {timeAgo(comment.createdUtc, now)}
        </time>
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
          key={`${comment.likes}:${comment.score}`}
          fullname={comment.fullname}
          likes={comment.likes}
          score={comment.score}
          hideScore={comment.scoreHidden}
          disabled={comment.flags.archived || comment.removal !== null}
          noun="comment"
        />
        <SaveButton key={String(comment.saved)} fullname={comment.fullname} saved={comment.saved} />
        <Link
          href={comment.permalink as Route}
          className={styles.action}
          transitionTypes={['nav-forward']}
        >
          View context
        </Link>
      </div>
    </article>
  )
}
