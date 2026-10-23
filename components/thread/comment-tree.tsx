import type { Route } from 'next'
import Link from 'next/link'
import { useId } from 'react'

import { deleteCommentForm } from '@/app/actions/comments'
import { ActionForm } from '@/components/islands/action-form'
import type { CommentComposerProps } from '@/components/islands/comment-composer'
import { ComposerDetails } from '@/components/islands/composer-details'
import { LinkPendingHint } from '@/components/islands/link-pending-hint'
import { LiveTime } from '@/components/islands/live-time'
import { PendingButton } from '@/components/islands/pending-button'
import { SaveButton } from '@/components/islands/save-button'
import { VoteButtons } from '@/components/islands/vote-buttons'
import { RedditHtml } from '@/components/reddit-html'
import { Button } from '@/components/ui/button'
import { FlairText } from '@/components/ui/flair-text'
import { absoluteTime, compactNumber } from '@/lib/format'
import { expandMoreHref, type ThreadQuery } from '@/lib/url-state'
import type { CommentNode, CommentView, MoreNode } from '@/lib/view-models'

import styles from './comment-tree.module.css'
import { ComposerForm } from './composer-form'

export interface TreeContext {
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

/** A comment tree: Server Components all the way down; only actions hydrate. */
export function CommentTree({ nodes, ctx }: { nodes: CommentNode[]; ctx: TreeContext }) {
  return (
    <ol className={styles.tree} role="list">
      {nodes.map((node) => (
        <li key={node.kind === 'more' ? `more-${node.id}` : node.comment.id}>
          {node.kind === 'more' ? (
            <MoreLink ctx={ctx} node={node} />
          ) : (
            <Comment comment={node.comment} ctx={ctx} replies={node.replies} />
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
      aria-labelledby={headingId}
      className={styles.comment}
      data-focus={comment.id === ctx.focusCommentId ? '' : undefined}
      id={`c-${comment.id}`}
    >
      <details className={styles.details} open={!comment.flags.collapsed}>
        <summary className={styles.header} id={headingId}>
          <span className={styles.author}>
            {comment.author ? `u/${comment.author}` : '[deleted]'}
          </span>
          {comment.flags.isSubmitter ? <span className={styles.op}>OP</span> : null}
          {comment.distinguished ? (
            <span className={styles.mod}>
              {comment.distinguished === 'admin' ? 'Admin' : 'Mod'}
            </span>
          ) : null}
          {comment.flair ? (
            <span className={styles.flair}>
              <FlairText flair={comment.flair} />
            </span>
          ) : null}
          {/* The poll renders comments with this same component, so the route has to bundle it. */}
          <LiveTime now={ctx.now} utc={comment.createdUtc} />
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
              disabled={locked || gone}
              fullname={comment.fullname}
              hideScore={comment.scoreHidden}
              key={`${comment.likes}:${comment.score}`}
              likes={comment.likes}
              noun="comment"
              score={comment.score}
            />
            {gone ? null : (
              <SaveButton
                fullname={comment.fullname}
                key={String(comment.saved)}
                saved={comment.saved}
              />
            )}
            {locked || gone ? null : (
              <Composer
                props={{ mode: 'reply', parent: comment.fullname, me: ctx.me, label: 'Reply' }}
                summary="Reply"
              />
            )}
            {comment.mine && !locked && comment.bodyMarkdown !== null ? (
              <Composer
                props={{ mode: 'edit', thing: comment.fullname, initial: comment.bodyMarkdown }}
                summary="Edit"
              />
            ) : null}
            {comment.mine ? (
              <DeleteComment fullname={comment.fullname} permalink={comment.permalink} />
            ) : null}
            <Link
              className={styles.action}
              href={comment.permalink as Route}
              transitionTypes={['nav-forward']}
            >
              Link
            </Link>
          </footer>

          {replies.length > 0 ? <CommentTree ctx={ctx} nodes={replies} /> : null}
        </div>
      </details>
    </article>
  )
}

function Composer({ summary, props }: { summary: string; props: CommentComposerProps }) {
  return (
    <ComposerDetails
      className={styles.inline}
      composer={props}
      fallback={<ComposerForm {...props} />}
      summary={summary}
      summaryClassName={styles.action}
    />
  )
}

/** Deleting asks first, in a native popover. Works without JavaScript. */
function DeleteComment({ fullname, permalink }: { fullname: string; permalink: string }) {
  const id = useId()
  const post = /\/comments\/([a-z0-9]+)\//.exec(permalink)?.[1] ?? ''
  return (
    <>
      <button className={styles.action} popoverTarget={id} type="button">
        Delete
      </button>
      <div
        aria-label="Delete comment"
        className={styles.confirm}
        id={id}
        popover="auto"
        role="dialog"
      >
        <p>Delete this comment? This can&apos;t be undone.</p>
        <div className={styles.confirmActions}>
          <Button popoverTarget={id} popoverTargetAction="hide" size="sm" variant="secondary">
            Cancel
          </Button>
          <ActionForm action={deleteCommentForm}>
            <input name="thing" type="hidden" value={fullname} />
            <input name="post" type="hidden" value={post} />
            <PendingButton variant="danger">Delete</PendingButton>
          </ActionForm>
        </div>
      </div>
    </>
  )
}

/**
 * "Load N more replies" expands in place through the URL;
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
      <Link className={styles.more} href={expand as Route} scroll={false}>
        Load {compactNumber(node.count)} more {node.count === 1 ? 'reply' : 'replies'}
        <LinkPendingHint />
      </Link>
    )
  }
  if (!parentComment) return null
  return (
    <Link
      className={styles.more}
      href={`${ctx.postPath}/${parentComment}` as Route}
      transitionTypes={['nav-forward']}
    >
      Continue this thread →
    </Link>
  )
}

export function CommentTreeSkeleton() {
  // Depths 0, 1, 2, 0: the shape of a typical thread's first comments.
  return (
    <div aria-busy="true" className={styles.skeleton}>
      <span className="visually-hidden">Loading comments…</span>
      {[0, 1, 2, 0].map((depth, index) => (
        <div
          aria-hidden="true"
          className={styles.skeletonComment}
          key={index}
          style={{ marginInlineStart: `${depth * 1.25}rem` }}
        >
          <span className={`skeleton ${styles.skeletonMeta}`} />
          <span className={`skeleton ${styles.skeletonLine}`} />
          <span className={`skeleton ${styles.skeletonLine} ${styles.short}`} />
        </div>
      ))}
    </div>
  )
}
