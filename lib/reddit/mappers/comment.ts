import 'server-only'
import type { CommentNode, CommentView, Removal } from '@/lib/view-models'
import { parseListing } from '../listing'
import { sanitizeRedditHtml } from '../sanitize'
import { CommentOrMore, type RedditComment, type RedditMore } from '../schemas/comment'
import { appPath, authorName, distinguishedFrom, editedAt, flairFrom, toVote } from './shared'

/** `viewer` is the signed-in username; it decides whether the comment is editable. */
export function mapComment(comment: RedditComment, viewer: string | null = null): CommentView {
  const removal = commentRemoval(comment)
  const mine = viewer !== null && !removal && comment.author.toLowerCase() === viewer.toLowerCase()
  return {
    id: comment.id,
    fullname: `t1_${comment.id}`,
    author: authorName(comment.author),
    body: removal
      ? null
      : sanitizeRedditHtml(comment.body_html, {
          inlineMedia: { metadata: comment.media_metadata },
        }),
    createdUtc: comment.created_utc,
    editedUtc: editedAt(comment.edited),
    score: comment.score,
    scoreHidden: comment.score_hidden,
    likes: toVote(comment.likes),
    saved: comment.saved,
    flags: {
      stickied: comment.stickied,
      locked: comment.locked,
      archived: comment.archived,
      isSubmitter: comment.is_submitter,
      collapsed: comment.collapsed,
    },
    distinguished: distinguishedFrom(comment.distinguished),
    removal,
    flair: flairFrom(
      comment.author_flair_text,
      comment.author_flair_background_color,
      comment.author_flair_text_color,
    ),
    permalink: appPath(comment.permalink, `/r/${comment.subreddit}`),
    depth: comment.depth ?? 0,
    context:
      comment.link_title && comment.link_permalink
        ? {
            postTitle: comment.link_title,
            postPermalink: appPath(comment.link_permalink, `/r/${comment.subreddit}`),
            subreddit: comment.subreddit,
          }
        : null,
    mine,
    bodyMarkdown: mine ? comment.body : null,
  }
}

export function mapMore(more: RedditMore): CommentNode {
  return {
    kind: 'more',
    id: more.id,
    parentId: more.parent_id,
    depth: more.depth,
    count: more.count,
    children: more.children,
  }
}

/**
 * A comment Listing as a tree. The top-level envelope is strict (a bad one is
 * a schema error for the page); nested `replies` degrade to no replies.
 */
export function mapCommentTree(
  listing: unknown,
  endpoint: string,
  viewer: string | null = null,
): CommentNode[] {
  return parseListing(listing, CommentOrMore, endpoint).items.map((child) =>
    child.kind === 'more'
      ? mapMore(child.data)
      : {
          kind: 'comment',
          comment: mapComment(child.data, viewer),
          replies: mapReplies(child.data.replies, endpoint, viewer),
        },
  )
}

/** `replies` is `""` for a leaf, otherwise a Listing of the same shape. */
function mapReplies(replies: unknown, endpoint: string, viewer: string | null): CommentNode[] {
  if (typeof replies !== 'object' || replies === null) return []
  try {
    return mapCommentTree(replies, endpoint, viewer)
  } catch (error) {
    console.warn('[reddit:schema]', endpoint, 'dropped malformed replies', error)
    return []
  }
}

/** Moderator removals, and Reddit's own legal and safety takedowns. */
const REMOVED_BODIES = new Set(['[removed]', '[ Removed by Reddit ]'])

/** Reddit replaces the body with a marker; a deletion also blanks the author. */
function commentRemoval(comment: RedditComment): Removal | null {
  if (REMOVED_BODIES.has(comment.body)) return 'removed'
  if (comment.body === '[deleted]' && comment.author === '[deleted]') return 'deleted'
  return null
}
