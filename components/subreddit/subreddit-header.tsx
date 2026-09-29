/* eslint-disable @next/next/no-img-element -- Reddit-hosted icon and banner; see components/media/post-media.tsx */
import { RedditHtml } from '@/components/reddit-html'
import { compactNumber } from '@/lib/format'
import { getSubreddit } from '@/lib/reddit/reads'
import { handleReadError } from '@/lib/reddit/read-errors'
import type { SubredditView } from '@/lib/view-models'
import styles from './subreddit-header.module.css'

/** `r/popular` and `r/all` are feeds, not communities: they have no about page. */
const PSEUDO_SUBREDDITS = new Set(['popular', 'all'])

export function isPseudoSubreddit(name: string): boolean {
  return PSEUDO_SUBREDDITS.has(name.toLowerCase())
}

/**
 * The community banner, icon, name, and member count. A sibling boundary of
 * the feed, so each reveals as soon as its own Reddit call resolves (design §8.4).
 */
export async function SubredditHeader({ params }: { params: Promise<{ subreddit: string }> }) {
  const { subreddit: name } = await params
  if (isPseudoSubreddit(name)) return <PlainHeader title={`r/${name.toLowerCase()}`} />

  let subreddit: SubredditView
  try {
    subreddit = await getSubreddit(name)
  } catch (error) {
    // The feed below shows why (private, quarantined, …); the header just names it.
    handleReadError(error)
    return <PlainHeader title={`r/${name}`} />
  }

  return (
    <header className={styles.root}>
      <div
        className={styles.banner}
        style={{
          backgroundColor: subreddit.color ?? undefined,
          backgroundImage: subreddit.banner
            ? `url(${JSON.stringify(subreddit.banner)})`
            : undefined,
        }}
      />
      <div className={styles.identity}>
        {subreddit.icon ? (
          <img className={styles.icon} src={subreddit.icon} alt="" width={64} height={64} />
        ) : (
          <span className={styles.iconFallback} aria-hidden="true">
            r/
          </span>
        )}
        <div className={styles.names}>
          <h1 className={styles.title}>r/{subreddit.name}</h1>
          <p className={styles.meta}>
            {subreddit.title ? <span>{subreddit.title}</span> : null}
            {subreddit.subscribers !== null ? (
              <span>{compactNumber(subreddit.subscribers)} members</span>
            ) : null}
            {subreddit.nsfw ? <span className={styles.nsfw}>NSFW</span> : null}
          </p>
        </div>
      </div>
      {subreddit.description ? (
        <RedditHtml html={subreddit.description} className={styles.description} />
      ) : null}
    </header>
  )
}

function PlainHeader({ title }: { title: string }) {
  return (
    <header className={styles.plain}>
      <h1 className={styles.title}>{title}</h1>
    </header>
  )
}

export function SubredditHeaderSkeleton() {
  return (
    <div className={styles.root} aria-busy="true">
      <span className="visually-hidden">Loading community…</span>
      <span className={`skeleton ${styles.banner}`} aria-hidden="true" />
      <div className={styles.identity} aria-hidden="true">
        <span className={`skeleton ${styles.iconFallback}`} />
        <div className={styles.names}>
          <span className={`skeleton ${styles.titleSkeleton}`} />
          <span className={`skeleton ${styles.metaSkeleton}`} />
        </div>
      </div>
    </div>
  )
}
