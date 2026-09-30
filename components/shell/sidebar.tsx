/* eslint-disable @next/next/no-img-element -- tiny Reddit-hosted icons; see components/media/post-media.tsx */
import type { Route } from 'next'
import Link from 'next/link'
import { ViewTransition } from 'react'
import { SiteLinks } from '@/components/site/site-links'
import { getMyMultis, getMySubscriptions } from '@/lib/reddit/reads'
import { handleReadError } from '@/lib/reddit/read-errors'
import type { MultiView, SubredditView } from '@/lib/view-models'
import styles from './sidebar.module.css'

/** Rows fade in and out when a subscription changes (design §8.5, list-change). */
const LIST_ENTER = { 'list-change': 'fade-in', default: 'none' }
const LIST_EXIT = { 'list-change': 'fade-out', default: 'none' }

/** How many communities the sidebar lists before "Manage →". */
const COMMUNITY_LIMIT = 50

const FEEDS: Array<{ href: Route; label: string }> = [
  { href: '/home', label: 'Home' },
  { href: '/r/popular' as Route, label: 'Popular' },
  { href: '/r/all' as Route, label: 'All' },
  { href: '/active' as Route, label: 'Active' },
  { href: '/saved' as Route, label: 'Saved' },
]

/** The fixed links, which need no data, so they render in the static shell. */
export function SidebarFeeds() {
  return (
    <nav aria-label="Feeds" className={styles.section}>
      <ul role="list" className={styles.list}>
        {FEEDS.map((feed) => (
          <li key={feed.label}>
            <Link href={feed.href} className={styles.link}>
              {feed.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** About, Donate, and GitHub at the foot of the sidebar. Static, like `SidebarFeeds`. */
export function SidebarSiteLinks() {
  return (
    <div className={styles.section}>
      <SiteLinks className={styles.siteLinks} linkClassName={styles.siteLink} />
    </div>
  )
}

/**
 * Multis, communities, and followed people (design §10.1). It streams in
 * behind its own boundary and persists across navigations in the layout.
 */
export async function SidebarLists() {
  let subscriptions: SubredditView[]
  let multis: MultiView[]
  try {
    ;[subscriptions, multis] = await Promise.all([getMySubscriptions(), getMyMultis()])
  } catch (error) {
    handleReadError(error)
    return null
  }

  const communities = subscriptions.filter((entry) => entry.kind === 'community')
  const people = subscriptions.filter((entry) => entry.kind === 'user')

  return (
    <>
      <nav aria-label="Multireddits" className={styles.section}>
        <h2 className={styles.heading}>
          Multis
          <Link href={'/multis' as Route} className={styles.headingLink}>
            Manage
          </Link>
        </h2>
        {multis.length > 0 ? (
          <ul role="list" className={styles.list}>
            {multis.map((multi) => (
              <li key={multi.href}>
                <Link href={multi.href as Route} className={styles.link}>
                  <Icon src={multi.icon} fallback="m" />
                  <span className={styles.label}>{multi.displayName}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No multis yet.</p>
        )}
      </nav>

      <nav aria-label="Communities" className={styles.section}>
        <h2 className={styles.heading}>
          Communities
          <Link href={'/subreddits' as Route} className={styles.headingLink}>
            Manage
          </Link>
        </h2>
        {communities.length > 0 ? (
          <ul role="list" className={styles.list}>
            {communities.slice(0, COMMUNITY_LIMIT).map((community) => (
              <ViewTransition
                key={community.fullname}
                enter={LIST_ENTER}
                exit={LIST_EXIT}
                default="none"
              >
                {' '}
                <li>
                  <Link href={community.href as Route} className={styles.link}>
                    <Icon src={community.icon} fallback="r" />
                    <span className={styles.label}>r/{community.name}</span>
                  </Link>
                </li>{' '}
              </ViewTransition>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>You haven’t joined any communities.</p>
        )}
        {communities.length > COMMUNITY_LIMIT ? (
          <Link href={'/subreddits' as Route} className={styles.more}>
            All {communities.length} communities →
          </Link>
        ) : null}
      </nav>

      {people.length > 0 ? (
        <nav aria-label="People" className={styles.section}>
          <h2 className={styles.heading}>People</h2>
          <ul role="list" className={styles.list}>
            {people.map((person) => (
              <ViewTransition
                key={person.fullname}
                enter={LIST_ENTER}
                exit={LIST_EXIT}
                default="none"
              >
                {' '}
                <li>
                  <Link href={person.href as Route} className={styles.link}>
                    <Icon src={person.icon} fallback="u" />
                    <span className={styles.label}>u/{person.name}</span>
                  </Link>
                </li>{' '}
              </ViewTransition>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  )
}

function Icon({ src, fallback }: { src: string | null; fallback: string }) {
  return src ? (
    <img
      className={styles.icon}
      src={src}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className={styles.iconFallback} aria-hidden="true">
      {fallback}
    </span>
  )
}

export function SidebarSkeleton() {
  return (
    <div className={styles.section} aria-busy="true">
      <span className="visually-hidden">Loading your communities…</span>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <span key={index} className={`skeleton ${styles.rowSkeleton}`} aria-hidden="true" />
      ))}
    </div>
  )
}
