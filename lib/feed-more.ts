import type { FeedSource } from '@/lib/reddit/reads'
import type { FeedSort, ProfileTab, SavedType, SearchTab, TimeRange } from '@/lib/url-state'

/*
 * What the infinite-scroll island asks the server for: one more page of a feed,
 * after the cursor it already has. Types only, so the island can import it.
 */

/** A post feed, or one of the mixed and community lists that page the same way. */
export type MoreSource =
  | FeedSource
  | { type: 'saved'; filter: SavedType }
  | { type: 'user'; name: string; tab: ProfileTab }
  | { type: 'search'; q: string; tab: SearchTab }

export type MoreFeedRequest = {
  source: MoreSource
  sort: FeedSort
  t: TimeRange
  after: string
  /** Items already shown, Reddit's numbering hint. */
  count: number
  showSubreddit: boolean
}

/** How a page's items are drawn: post cards, mixed posts and comments, or community rows. */
export function listKind(source: MoreSource): 'posts' | 'items' | 'rows' {
  if (source.type === 'saved' || source.type === 'user') return 'items'
  if (source.type === 'search') return source.tab === 'posts' ? 'items' : 'rows'
  return 'posts'
}
