import { ForbiddenPanel } from '@/components/feed/forbidden-panel'
import { getActiveThreads } from '@/lib/reddit/active'
import { handleReadError } from '@/lib/reddit/read-errors'
import { requestTime } from '@/lib/request-time'
import { getSettings } from '@/lib/settings'
import type { PostView } from '@/lib/view-models'
import { FeedItems } from './feed-items'
import styles from './feed.module.css'

/** Busy game, match, and daily threads from the last 12 hours. */
export async function ActiveSection() {
  const now = await requestTime()
  let posts: PostView[]
  try {
    posts = await getActiveThreads(now)
  } catch (error) {
    return <ForbiddenPanel reason={handleReadError(error)} />
  }
  const { blurNsfw } = await getSettings()

  if (posts.length === 0) {
    return (
      <div className={styles.notice}>
        <p className={styles.noticeTitle}>Nothing busy right now</p>
        <p>Game, match, and daily threads show up here while people are in them.</p>
      </div>
    )
  }
  return (
    <section className={styles.feed} aria-label="Active threads">
      <ol role="list" className={`${styles.items} ${styles.posts}`}>
        <FeedItems posts={posts} showSubreddit blurNsfw={blurNsfw} now={now} />
      </ol>
    </section>
  )
}
