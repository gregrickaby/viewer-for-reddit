import type { FeedSource } from '@/lib/reddit/reads'
import type { FeedSort, TimeRange } from '@/lib/url-state'

/*
 * What the infinite-scroll island asks the server for: one more page of a feed,
 * after the cursor it already has. Types only, so the island can import it.
 */
export type MoreFeedRequest = {
  source: FeedSource
  sort: FeedSort
  t: TimeRange
  after: string
  /** Items already shown, Reddit's numbering hint. */
  count: number
  showSubreddit: boolean
}
