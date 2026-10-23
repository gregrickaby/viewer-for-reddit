import type { Route } from 'next'
import Link from 'next/link'

import { LiveBody, LiveCount } from '@/components/islands/live-thread'
import { SaveButton } from '@/components/islands/save-button'
import { VoteButtons } from '@/components/islands/vote-buttons'
import { MediaReveal, PostMedia, type RevealReason } from '@/components/media/post-media'
import { RedditHtml } from '@/components/reddit-html'
import { FlairText } from '@/components/ui/flair-text'
import { absoluteTime, compactNumber, isoTime, timeAgo } from '@/lib/format'
import { hasInlineMedia } from '@/lib/media/inline'
import type { PostView, SafeHtml } from '@/lib/view-models'

import styles from './post-card.module.css'

/** Self text longer than this gets a "Read more" (the clamp is ~12 lines). */
const EXCERPT_CHARS = 900

export interface PostCardProps {
  post: PostView
  /** Omitted on the subreddit's own page. */
  showSubreddit: boolean
  /** `detail` is the post page: an h1 title, the full body, and comments below. */
  variant?: 'feed' | 'detail'
  blurNsfw: boolean
  /** Request time, for relative ages. */
  now: number
}

/** Why a post's media waits behind a "Show", if it does. */
export function revealReason(post: PostView, blurNsfw: boolean): RevealReason {
  return post.flags.spoiler ? 'spoiler' : post.flags.nsfw && blurNsfw ? 'nsfw' : null
}

/** A feed item. A Server Component; only voting and saving hydrate. */
export function PostCard({ post, showSubreddit, blurNsfw, now, variant = 'feed' }: PostCardProps) {
  const detail = variant === 'detail'
  const titleId = `post-${post.id}-title`
  const reveal = revealReason(post, blurNsfw)
  const inactive = post.flags.archived || post.flags.locked

  return (
    <article
      aria-labelledby={titleId}
      className={detail ? styles.card : `${styles.card} ${styles.interactive}`}
    >
      <div className={styles.votes}>
        <VoteButtons
          disabled={post.flags.archived}
          fullname={post.fullname}
          hideScore={post.hideScore}
          key={`${post.likes}:${post.score}`}
          likes={post.likes}
          noun="post"
          score={post.score}
        />
      </div>

      <div className={styles.body}>
        <p className={styles.meta}>
          {showSubreddit ? (
            <Link
              className={styles.subreddit}
              href={`/r/${post.subreddit}` as Route}
              transitionTypes={['nav-forward']}
            >
              r/{post.subreddit}
            </Link>
          ) : null}
          <span>
            {post.author ? (
              <Link href={`/user/${post.author}` as Route} transitionTypes={['nav-forward']}>
                u/{post.author}
              </Link>
            ) : (
              '[deleted]'
            )}
          </span>
          <time dateTime={isoTime(post.createdUtc)} title={absoluteTime(post.createdUtc)}>
            {timeAgo(post.createdUtc, now)}
          </time>
          {post.distinguished ? (
            <span className={styles.mod}>{post.distinguished === 'admin' ? 'Admin' : 'Mod'}</span>
          ) : null}
          {post.flags.stickied ? <span className={styles.badge}>Pinned</span> : null}
          {post.flags.locked ? <span className={styles.badge}>Locked</span> : null}
          {post.flags.nsfw ? <span className={styles.nsfw}>NSFW</span> : null}
          {post.flags.spoiler ? <span className={styles.spoiler}>Spoiler</span> : null}
          {post.flair ? (
            <span
              className={styles.flair}
              data-text={post.flair.backgroundColor ? post.flair.textColor : undefined}
              style={
                post.flair.backgroundColor
                  ? { backgroundColor: post.flair.backgroundColor }
                  : undefined
              }
            >
              <FlairText flair={post.flair} />
            </span>
          ) : null}
        </p>

        {detail ? (
          <h1 className={`${styles.title} ${styles.detailTitle}`} id={titleId}>
            {post.title}
          </h1>
        ) : (
          <h2 className={styles.title} id={titleId}>
            <Link href={post.permalink as Route} transitionTypes={['nav-forward']}>
              {post.title}
            </Link>
          </h2>
        )}

        {post.crosspostFrom ? (
          <p className={styles.crosspost}>
            Crossposted from{' '}
            <Link href={post.crosspostFrom.permalink as Route} transitionTypes={['nav-forward']}>
              r/{post.crosspostFrom.subreddit}
            </Link>
          </p>
        ) : null}

        {post.removal ? (
          <p className={styles.removed}>
            {post.removal === 'deleted' ? 'Deleted by its author.' : 'Removed.'}
          </p>
        ) : null}

        <PostMedia media={post.media} postId={post.id} reveal={reveal} title={post.title} />

        {post.body ? (
          detail ? (
            <LiveBody>
              <PostBody excerpt={false} html={post.body} reveal={reveal} />
            </LiveBody>
          ) : (
            <PostBody excerpt html={post.body} reveal={reveal} />
          )
        ) : null}

        <div className={styles.actions}>
          <Link
            className={styles.action}
            href={(detail ? '#comments' : post.permalink) as Route}
            transitionTypes={detail ? undefined : ['nav-forward']}
          >
            <svg aria-hidden="true" focusable="false" height="16" viewBox="0 0 20 20" width="16">
              <path d="M3 4h14v9H8l-4 3v-3H3z" />
            </svg>
            {detail ? (
              <LiveCount
                hiddenClass={styles.narrowHidden}
                initial={post.numComments}
                noun="comment"
              />
            ) : (
              <>
                {compactNumber(post.numComments)}
                <span className={styles.narrowHidden}>
                  {` ${post.numComments === 1 ? 'comment' : 'comments'}`}
                </span>
              </>
            )}
          </Link>
          <SaveButton fullname={post.fullname} key={String(post.saved)} saved={post.saved} />
          <a
            className={styles.action}
            href={`https://www.reddit.com${post.permalink}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className={`${styles.narrowHidden} ${styles.linkText}`}>Open on Reddit </span>↗
          </a>
          {inactive ? (
            <span className={styles.status}>
              {post.flags.archived ? 'Archived' : 'Comments locked'}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/**
 * Self text, clamped in feeds. Images inside it follow the post's NSFW and
 * spoiler reveal, like its other media, so a body with inline
 * media waits behind the same "Show".
 */
export function PostBody({
  html,
  excerpt,
  reveal,
}: {
  html: SafeHtml
  excerpt: boolean
  reveal: RevealReason
}) {
  const body =
    excerpt && html.length > EXCERPT_CHARS ? (
      <div className={styles.excerpt}>
        <RedditHtml className={styles.excerptBody} html={html} />
        <details className={styles.more}>
          <summary>Read more</summary>
        </details>
      </div>
    ) : (
      <RedditHtml html={html} />
    )
  return reveal && hasInlineMedia(html) ? (
    <MediaReveal blurred={null} reason={reveal}>
      {body}
    </MediaReveal>
  ) : (
    body
  )
}

/** Mirrors the card's layout exactly, so the swap causes no layout shift. */
export function PostCardSkeleton() {
  return (
    <div aria-hidden="true" className={styles.card}>
      <div className={styles.votes}>
        <span className={`skeleton ${styles.voteSkeleton}`} />
      </div>
      <div className={styles.body}>
        <span className={`skeleton ${styles.metaSkeleton}`} />
        <span className={`skeleton ${styles.titleSkeleton}`} />
        <span className={`skeleton ${styles.titleSkeleton} ${styles.short}`} />
        <span className={`skeleton ${styles.mediaSkeleton}`} />
      </div>
    </div>
  )
}
