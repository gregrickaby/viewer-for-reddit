/* eslint-disable @next/next/no-img-element -- Reddit-hosted icon and banner; see components/media/post-media.tsx */
import { SubscribeButton } from '@/components/islands/subscribe-button'
import { AddToMultiMenu } from '@/components/multi/add-to-multi-menu'
import { RedditHtml } from '@/components/reddit-html'
import { compactNumber } from '@/lib/format'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getMyMultis, getSubreddit } from '@/lib/reddit/reads'
import type { MultiView, SubredditView } from '@/lib/view-models'

import styles from './subreddit-header.module.css'

/** `r/popular` and `r/all` are feeds, not communities: they have no about page. */
const PSEUDO_SUBREDDITS = new Set(['popular', 'all'])

export function isPseudoSubreddit(name: string): boolean {
  return PSEUDO_SUBREDDITS.has(name.toLowerCase())
}

/**
 * The community banner, icon, name, and member count. A sibling boundary of
 * the feed, so each reveals as soon as its own Reddit call resolves.
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
  // The menu is optional: without multis (or if Reddit fails), the header still works.
  const multis: MultiView[] | null = await getMyMultis().catch(() => null)

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
          <img alt="" className={styles.icon} height={64} src={subreddit.icon} width={64} />
        ) : (
          <span aria-hidden="true" className={styles.iconFallback}>
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
        <div className={styles.actions}>
          <SubscribeButton
            key={String(subreddit.subscribed)}
            kind="community"
            name={subreddit.name}
            subscribed={subreddit.subscribed}
          />
          {multis ? <AddToMultiMenu multis={multis} subreddit={subreddit.name} /> : null}
        </div>
      </div>
      {subreddit.description ? (
        <RedditHtml className={styles.description} html={subreddit.description} />
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
    <div aria-busy="true" className={styles.root}>
      <span className="visually-hidden">Loading community…</span>
      <span aria-hidden="true" className={`skeleton ${styles.banner}`} />
      <div aria-hidden="true" className={styles.identity}>
        <span className={`skeleton ${styles.iconFallback}`} />
        <div className={styles.names}>
          <span className={`skeleton ${styles.titleSkeleton}`} />
          <span className={`skeleton ${styles.metaSkeleton}`} />
        </div>
      </div>
    </div>
  )
}
