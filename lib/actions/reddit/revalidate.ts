'use server'

import {updateTag} from 'next/cache'

/**
 * Expires the shared 'posts' cache tag so the next feed request (home,
 * subreddit, or multireddit) fetches fresh data instead of serving a
 * stale, time-based cache entry. `router.refresh()` alone only clears the
 * client-side route cache, it doesn't touch the server's fetch cache, so a
 * tab left open past `CACHE_POSTS` needs this too.
 */
export async function revalidateFeeds(): Promise<void> {
  updateTag('posts')
}
