import { ContentReveal } from '@/components/motion/transitions'
import { type FeedSource, getFeed } from '@/lib/reddit/reads'
import { handleReadError } from '@/lib/reddit/read-errors'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import { type FeedSort, feedKey, parseFeedQuery } from '@/lib/url-state'
import type { Page, PostView } from '@/lib/view-models'
import { ForbiddenPanel } from './forbidden-panel'
import { Pagination } from './pagination'
import { PostCard, PostCardSkeleton } from './post-card'
import { SortTabs, SortTabsSkeleton } from './sort-tabs'
import styles from './feed.module.css'

export type FeedSectionProps = {
  source: FeedSource
  /** The route the tabs and cursors link to, such as `/r/pics`. */
  base: string
  /** Allowed sorts; the first is the default and is left out of URLs. */
  sorts: readonly FeedSort[]
  searchParams: Promise<Record<string, string | string[] | undefined>>
  showSubreddit: boolean
}

/**
 * One page of a feed with its sort tabs and cursors (implementation §3.5).
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
    <section className={styles.feed} aria-label="Posts">
      <SortTabs base={base} sorts={sorts} query={query} />
      <ContentReveal name="feed-content" contentKey={feedKey(query)}>
        <div className={styles.list}>
          {page.items.length > 0 ? (
            <ol role="list" className={styles.items}>
              {page.items.map((post) => (
                <li key={post.id} className={styles.item}>
                  <PostCard
                    post={post}
                    showSubreddit={showSubreddit}
                    blurNsfw={blurNsfw}
                    now={now}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.notice}>
              <p className={styles.noticeTitle}>Nothing here yet</p>
              <p>There are no posts to show for this sort.</p>
            </div>
          )}
        </div>
      </ContentReveal>
      <Pagination
        base={base}
        query={query}
        after={page.after}
        firstFullname={page.items[0]?.fullname}
        defaultSort={sorts[0]!}
      />
    </section>
  )
}

export function FeedSkeleton() {
  return (
    <div className={styles.feed} aria-busy="true">
      <span className="visually-hidden">Loading posts…</span>
      <SortTabsSkeleton />
      <ol role="list" className={styles.items} aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <li key={index} className={styles.item}>
            <PostCardSkeleton />
          </li>
        ))}
      </ol>
    </div>
  )
}
