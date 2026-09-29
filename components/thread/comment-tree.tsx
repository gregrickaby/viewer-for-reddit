import type { Route } from 'next'
import Link from 'next/link'
import { useId } from 'react'
import { deleteComment } from '@/app/actions/comments'
import { CommentComposer } from '@/components/islands/comment-composer'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import { PendingButton } from '@/components/islands/pending-button'
import { SaveButton } from '@/components/islands/save-button'
import { VoteButtons } from '@/components/islands/vote-buttons'
import { RedditHtml } from '@/components/reddit-html'
import { formAction } from '@/lib/actions/form-action'
import { absoluteTime, compactNumber, isoTime, timeAgo } from '@/lib/format'
import { type ThreadQuery, expandMoreHref } from '@/lib/url-state'
import type { CommentNode, CommentView, MoreNode } from '@/lib/view-models'
import styles from './comment-tree.module.css'

export type TreeContext = {
  /** The post's own path, for "continue this thread" links. */
  postPath: string
  /** The URL being viewed (post, or single thread), for "load more" links. */
  threadBase: string
  query: ThreadQuery
  now: number
  /** The signed-in username, for pending comments. */
  me: string
  /** The post is locked or archived: no voting or replying anywhere. */
  readOnly: boolean
  focusCommentId: string | null
}

/** A comment tree (design §10.2): Server Components all the way down; only actions hydrate. */
export function CommentTree({ nodes, ctx }: { nodes: CommentNode[]; ctx: TreeContext }) {
  return (
    <ol role="list" className={styles.tree}>
      {nodes.map((node) => (
        <li key={node.kind === 'more' ? `more-${node.id}` : node.comment.id}>
          {node.kind === 'more' ? (
            <MoreLink node={node} ctx={ctx} />
          ) : (
            <Comment comment={node.comment} replies={node.replies} ctx={ctx} />
          )}
        </li>
      ))}
    </ol>
  )
}

function Comment({
  comment,
  replies,
  ctx,
}: {
  comment: CommentView
  replies: CommentNode[]
  ctx: TreeContext
}) {
  const headingId = `c-${comment.id}-h`
  const locked = ctx.readOnly || comment.flags.locked || comment.flags.archived
  const gone = comment.removal !== null

  return (
    <article
      id={`c-${comment.id}`}
      className={styles.comment}
      aria-labelledby={headingId}
      data-focus={comment.id === ctx.focusCommentId ? '' : undefined}
    >
      <details open={!comment.flags.collapsed} className={styles.details}>
        <summary id={headingId} className={styles.header}>
          <span className={styles.author}>
            {comment.author ? `u/${comment.author}` : '[deleted]'}
          </span>
          {comment.flags.isSubmitter ? <span className={styles.op}>OP</span> : null}
          {comment.distinguished ? (
            <span className={styles.mod}>
              {comment.distinguished === 'admin' ? 'Admin' : 'Mod'}
            </span>
          ) : null}
          {comment.flair ? <span className={styles.flair}>{comment.flair.text}</span> : null}
          <time dateTime={isoTime(comment.createdUtc)} title={absoluteTime(comment.createdUtc)}>
            {timeAgo(comment.createdUtc, ctx.now)}
          </time>
          {comment.editedUtc ? <span title={absoluteTime(comment.editedUtc)}>edited</span> : null}
          {comment.flags.stickied ? <span className={styles.op}>Pinned</span> : null}
        </summary>

        <div className={styles.body}>
          {gone ? (
            <p className={styles.removed}>
              {comment.removal === 'deleted' ? 'Deleted by its author.' : 'Removed.'}
            </p>
          ) : comment.body ? (
            <RedditHtml html={comment.body} />
          ) : null}

          <footer className={styles.actions}>
            <VoteButtons
              key={`${comment.likes}:${comment.score}`}
              fullname={comment.fullname}
              likes={comment.likes}
              score={comment.score}
              hideScore={comment.scoreHidden}
              disabled={locked || gone}
              noun="comment"
            />
            {gone ? null : (
              <SaveButton
                key={String(comment.saved)}
                fullname={comment.fullname}
                saved={comment.saved}
              />
            )}
            {locked || gone ? null : (
              <details className={styles.inline}>
                <summary className={styles.action}>Reply</summary>
                <CommentComposer mode="reply" parent={comment.fullname} me={ctx.me} label="Reply" />
              </details>
            )}
            {comment.mine && !locked && comment.bodyMarkdown !== null ? (
              <details className={styles.inline}>
                <summary className={styles.action}>Edit</summary>
                <CommentComposer
                  mode="edit"
                  thing={comment.fullname}
                  initial={comment.bodyMarkdown}
                />
              </details>
            ) : null}
            {comment.mine ? <DeleteComment fullname={comment.fullname} /> : null}
            <Link
              href={comment.permalink as Route}
              className={styles.action}
              transitionTypes={['nav-forward']}
            >
              Link
            </Link>
          </footer>

          {replies.length > 0 ? <CommentTree nodes={replies} ctx={ctx} /> : null}
        </div>
      </details>
    </article>
  )
}

/** Deleting asks first, in a native popover (design §10.3). Works without JavaScript. */
function DeleteComment({ fullname }: { fullname: string }) {
  const id = useId()
  return (
    <>
      <button type="button" className={styles.action} popoverTarget={id}>
        Delete
      </button>
      <div
        id={id}
        popover="auto"
        className={styles.confirm}
        role="dialog"
        aria-label="Delete comment"
      >
        <p>Delete this comment? This can’t be undone.</p>
        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.action}
            popoverTarget={id}
            popoverTargetAction="hide"
          >
            Cancel
          </button>
          <form action={formAction(deleteComment)}>
            <input type="hidden" name="thing" value={fullname} />
            <PendingButton>Delete</PendingButton>
          </form>
        </div>
      </div>
    </>
  )
}

/**
 * "Load N more replies" expands in place through the URL (design §8.3);
 * "Continue this thread" (Reddit's count-0 marker, or past the URL cap)
 * opens the parent comment's own thread.
 */
function MoreLink({ node, ctx }: { node: MoreNode; ctx: TreeContext }) {
  const parentComment = node.parentId.startsWith('t1_') ? node.parentId.slice(3) : null
  const expand =
    node.count > 0 && node.children.length > 0
      ? expandMoreHref(
          ctx.threadBase,
          ctx.query,
          node.id,
          parentComment ? `c-${parentComment}` : 'comments',
        )
      : null

  if (expand) {
    return (
      <Link href={expand as Route} scroll={false} className={styles.more}>
        Load {compactNumber(node.count)} more {node.count === 1 ? 'reply' : 'replies'}
        <LinkPendingHint />
      </Link>
    )
  }
  if (!parentComment) return null
  return (
    <Link
      href={`${ctx.postPath}/${parentComment}` as Route}
      className={styles.more}
      transitionTypes={['nav-forward']}
    >
      Continue this thread →
    </Link>
  )
}

export function CommentTreeSkeleton() {
  // Depths 0, 1, 2, 0, as the design specifies (§8.4).
  return (
    <div className={styles.skeleton} aria-busy="true">
      <span className="visually-hidden">Loading comments…</span>
      {[0, 1, 2, 0].map((depth, index) => (
        <div
          key={index}
          className={styles.skeletonComment}
          style={{ marginInlineStart: `${depth * 1.25}rem` }}
          aria-hidden="true"
        >
          <span className={`skeleton ${styles.skeletonMeta}`} />
          <span className={`skeleton ${styles.skeletonLine}`} />
          <span className={`skeleton ${styles.skeletonLine} ${styles.short}`} />
        </div>
      ))}
    </div>
  )
}
