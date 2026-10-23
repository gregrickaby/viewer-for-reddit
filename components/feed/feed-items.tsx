import type { PostView } from '@/lib/view-models'

import styles from './feed.module.css'
import { PostCard } from './post-card'

/** The `<li>`s of a post list: rendered by the feed page and by each infinite-scroll page. */
export function FeedItems({
  posts,
  showSubreddit,
  blurNsfw,
  now,
}: {
  posts: PostView[]
  showSubreddit: boolean
  blurNsfw: boolean
  now: number
}) {
  return posts.map((post) => (
    <li className={`${styles.item} ${styles.post}`} key={post.id}>
      <PostCard blurNsfw={blurNsfw} now={now} post={post} showSubreddit={showSubreddit} />
    </li>
  ))
}
