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

interface RowOptions {
  confirmLeave?: boolean
  showDescription?: boolean
  /** The viewer's multis, to offer "+ Multi" on communities. */
  multis?: MultiView[]
}

/** A list of communities or people, each with its own Join/Follow button. */
export function SubredditRows({ items, ...options }: { items: SubredditView[] } & RowOptions) {
  return (
    <ul className={styles.list} role="list">
      <SubredditRowItems items={items} {...options} />
    </ul>
  )
}

/** The `<li>`s of a row list: rendered by the page and by each infinite-scroll page. */
export function SubredditRowItems({
  items,
  confirmLeave = false,
  showDescription = false,
  multis,
}: { items: SubredditView[] } & RowOptions) {
  return items.map((item) => (
    <ViewTransition default="none" enter={LIST_CHANGE} exit={LIST_EXIT} key={item.fullname}>
      <li className={item.kind === 'user' ? `${styles.row} ${styles.person}` : styles.row}>
        {item.icon ? (
          <img
            alt=""
            className={styles.icon}
            decoding="async"
            height={40}
            loading="lazy"
            src={item.icon}
            width={40}
          />
        ) : (
          <span aria-hidden="true" className={styles.iconFallback}>
            {item.kind === 'user' ? 'u/' : 'r/'}
          </span>
        )}
        <div className={styles.text}>
          <Link className={styles.name} href={item.href as Route} transitionTypes={['nav-forward']}>
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
            <RedditHtml className={styles.description} html={item.description} />
          ) : null}
        </div>
        <div className={styles.actions}>
          <SubscribeButton
            confirmLeave={confirmLeave}
            key={String(item.subscribed)}
            kind={item.kind}
            name={item.name}
            subscribed={item.subscribed}
          />
          {multis && item.kind === 'community' ? (
            <AddToMultiMenu multis={multis} subreddit={item.name} />
          ) : null}
        </div>
      </li>
    </ViewTransition>
  ))
}

export function SubredditRowsSkeleton() {
  return (
    <div aria-busy="true" className={styles.list}>
      <span className="visually-hidden">Loading…</span>
      {[0, 1, 2, 3, 4].map((index) => (
        <div aria-hidden="true" className={styles.row} key={index}>
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
