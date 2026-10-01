/* eslint-disable @next/next/no-img-element -- Reddit-hosted icons; see components/media/post-media.tsx */
import type { Route } from 'next'
import Link from 'next/link'
import { ViewTransition } from 'react'
import { SubscribeButton } from '@/components/islands/subscribe-button'
import { AddToMultiMenu } from '@/components/multi/add-to-multi-menu'
import { RedditHtml } from '@/components/reddit-html'
import { compactNumber } from '@/lib/format'
import type { MultiView, SubredditView } from '@/lib/view-models'
import styles from './subreddit-row.module.css'

const LIST_CHANGE = { 'list-change': 'fade-in', default: 'none' }
const LIST_EXIT = { 'list-change': 'fade-out', default: 'none' }

/** A list of communities or people, each with its own Join/Follow button. */
export function SubredditRows({
  items,
  confirmLeave = false,
  showDescription = false,
  multis,
}: {
  items: SubredditView[]
  confirmLeave?: boolean
  showDescription?: boolean
  /** The viewer's multis, to offer "+ Multi" on communities. */
  multis?: MultiView[]
}) {
  return (
    <ul role="list" className={styles.list}>
      {items.map((item) => (
        <ViewTransition key={item.fullname} enter={LIST_CHANGE} exit={LIST_EXIT} default="none">
          <li className={item.kind === 'user' ? `${styles.row} ${styles.person}` : styles.row}>
            {item.icon ? (
              <img
                className={styles.icon}
                src={item.icon}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className={styles.iconFallback} aria-hidden="true">
                {item.kind === 'user' ? 'u/' : 'r/'}
              </span>
            )}
            <div className={styles.text}>
              <Link
                href={item.href as Route}
                className={styles.name}
                transitionTypes={['nav-forward']}
              >
                {item.kind === 'user' ? 'u/' : 'r/'}
                {item.name}
              </Link>
              <p className={styles.meta}>
                {item.subscribers !== null && item.kind === 'community' ? (
                  <span>{compactNumber(item.subscribers)} members</span>
                ) : null}
                {item.nsfw ? <span className={styles.nsfw}>NSFW</span> : null}
                {item.title && item.title !== item.name ? (
                  <span className={styles.title}>{item.title}</span>
                ) : null}
              </p>
              {showDescription && item.description ? (
                <RedditHtml html={item.description} className={styles.description} />
              ) : null}
            </div>
            <div className={styles.actions}>
              <SubscribeButton
                key={String(item.subscribed)}
                name={item.name}
                kind={item.kind}
                subscribed={item.subscribed}
                confirmLeave={confirmLeave}
              />
              {multis && item.kind === 'community' ? (
                <AddToMultiMenu subreddit={item.name} multis={multis} />
              ) : null}
            </div>
          </li>
        </ViewTransition>
      ))}
    </ul>
  )
}

export function SubredditRowsSkeleton() {
  return (
    <div className={styles.list} aria-busy="true">
      <span className="visually-hidden">Loading…</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className={styles.row} aria-hidden="true">
          <span className={`skeleton ${styles.iconFallback}`} />
          <div className={styles.text}>
            <span className={`skeleton ${styles.nameSkeleton}`} />
            <span className={`skeleton ${styles.metaSkeleton}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
