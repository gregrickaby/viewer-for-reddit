import { InfiniteFeed } from '@/components/islands/infinite-feed'
import { ContentReveal } from '@/components/motion/transitions'
import { handleReadError } from '@/lib/reddit/read-errors'
import { getFeed, type FeedSource } from '@/lib/reddit/reads'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import { feedKey, PAGE_SIZE, pageOffset, parseFeedQuery, type FeedSort } from '@/lib/url-state'
import type { Page, PostView } from '@/lib/view-models'

import { FeedItems } from './feed-items'
import styles from './feed.module.css'
import { ForbiddenPanel } from './forbidden-panel'
import { Pagination } from './pagination'
import { PostCardSkeleton } from './post-card'
import { SortTabs, SortTabsSkeleton } from './sort-tabs'

export interface FeedSectionProps {
  source: FeedSource
  /** The route the tabs and cursors link to, such as `/r/pics`. */
  base: string
  /** Allowed sorts; the first is the default and is left out of URLs. */
  sorts: readonly FeedSort[]
  searchParams: Promise<Record<string, string | string[] | undefined>>
  showSubreddit: boolean
}

/**
 * One page of a feed with its sort tabs and cursors; the
 * island after it appends later pages as the reader scrolls.
 * Reads request data, so it always renders inside a Suspense boundary.
 */
export async function FeedSection({
  source,
  base,
  sorts,
  searchParams,
  showSubreddit,
}: FeedSectionProps) {
  const query = parseFeedQuery(await searchParams, sorts)

  let page: Page<PostView>
  try {
    page = await getFeed(source, query)
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  const [{ blurNsfw }, now] = await Promise.all([getSettings(), requestTime()])

  return (
    <section aria-label="Posts" className={styles.feed}>
      <SortTabs base={base} query={query} sorts={sorts} />
      <ContentReveal contentKey={feedKey(query)} name="feed-content">
        <div className={styles.list}>
          {page.items.length > 0 ? (
            <ol className={`${styles.items} ${styles.posts}`} role="list">
              <FeedItems
                blurNsfw={blurNsfw}
                now={now}
                posts={page.items}
                showSubreddit={showSubreddit}
              />
            </ol>
          ) : (
            <div className={styles.notice}>
              <p className={styles.noticeTitle}>Nothing here yet</p>
              <p>There are no posts to show for this sort.</p>
            </div>
          )}
        </div>
      </ContentReveal>
      {page.after ? (
        <InfiniteFeed
          // Appended pages are rendered once and held in client state, so a
          // changed blur setting has to restart them.
          base={base}
          defaultSort={sorts[0]!}
          key={`${feedKey(query)}:${blurNsfw}`}
          request={{
            source,
            sort: query.sort,
            t: query.t,
            after: page.after,
            count: pageOffset(query) + PAGE_SIZE,
            showSubreddit,
          }}
        />
      ) : null}
      <Pagination
        after={page.after}
        base={base}
        defaultSort={sorts[0]!}
        firstFullname={page.items[0]?.fullname}
        infinite
        query={query}
      />
    </section>
  )
}

export function FeedSkeleton() {
  return (
    <div aria-busy="true" className={styles.feed}>
      <span className="visually-hidden">Loading posts…</span>
      <SortTabsSkeleton />
      <ol aria-hidden="true" className={styles.items} role="list">
        {[0, 1, 2].map((index) => (
          <li className={styles.item} key={index}>
            <PostCardSkeleton />
          </li>
        ))}
      </ol>
    </div>
  )
}
