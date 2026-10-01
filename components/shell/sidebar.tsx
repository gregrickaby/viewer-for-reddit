import type { Route } from 'next'
import Link from 'next/link'
import { SidebarFilter } from '@/components/islands/sidebar-filter'
import { SiteLinks } from '@/components/site/site-links'
import { getMyMultis, getMySubscriptions } from '@/lib/reddit/reads'
import { handleReadError } from '@/lib/reddit/read-errors'
import type { MultiView, SubredditView } from '@/lib/view-models'
import styles from './sidebar.module.css'

/** How many rows each sidebar list shows before the filter or "All N". */
const LIST_LIMIT = 50

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
          <SidebarFilter
            items={multis.map((multi) => ({
              key: multi.href,
              name: multi.displayName,
              label: multi.displayName,
              href: multi.href,
              icon: multi.icon,
            }))}
            limit={LIST_LIMIT}
            noun="multis"
            fallback="m"
            manageHref="/multis"
          />
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
          <SidebarFilter
            items={communities.map((community) => ({
              key: community.fullname,
              name: community.name,
              label: `r/${community.name}`,
              href: community.href,
              icon: community.icon,
            }))}
            limit={LIST_LIMIT}
            noun="communities"
            fallback="r"
            manageHref="/subreddits"
          />
        ) : (
          <p className={styles.empty}>You haven’t joined any communities.</p>
        )}
      </nav>

      {people.length > 0 ? (
        <nav aria-label="People" className={styles.section}>
          <h2 className={styles.heading}>People</h2>
          <SidebarFilter
            items={people.map((person) => ({
              key: person.fullname,
              name: person.name,
              label: `u/${person.name}`,
              href: person.href,
              icon: person.icon,
            }))}
            limit={LIST_LIMIT}
            noun="people"
            fallback="u"
            manageHref="/subreddits"
            manageFields={{ tab: 'people' }}
          />
        </nav>
      ) : null}
    </>
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
