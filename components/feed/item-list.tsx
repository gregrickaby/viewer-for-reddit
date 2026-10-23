import type { ListItem } from '@/lib/view-models'

import { CommentCard } from './comment-card'
import styles from './feed.module.css'
import { PostCard } from './post-card'

/** A mixed list of posts and comments (saved items, profiles). */
export function ItemList({
  items,
  now,
  blurNsfw,
  empty,
}: {
  items: ListItem[]
  now: number
  blurNsfw: boolean
  empty: { title: string; detail: string }
}) {
  if (items.length === 0) {
    return (
      <div className={styles.notice}>
        <p className={styles.noticeTitle}>{empty.title}</p>
        <p>{empty.detail}</p>
      </div>
    )
  }
  return (
    <ol role="list" className={styles.items}>
      <ListItems items={items} now={now} blurNsfw={blurNsfw} />
    </ol>
  )
}

/** The `<li>`s of a mixed list: rendered by the page and by each infinite-scroll page. */
export function ListItems({
  items,
  now,
  blurNsfw,
}: {
  items: ListItem[]
  now: number
  blurNsfw: boolean
}) {
  return items.map((item) => (
    <li
      key={item.kind === 'post' ? item.post.fullname : item.comment.fullname}
      className={item.kind === 'post' ? `${styles.item} ${styles.post}` : styles.item}
    >
      {item.kind === 'post' ? (
        <PostCard post={item.post} showSubreddit blurNsfw={blurNsfw} now={now} />
      ) : (
        <CommentCard comment={item.comment} now={now} />
      )}
    </li>
  ))
}

/** The fullname of the first item, the cursor for "Previous". */
export function firstFullname(items: ListItem[]): string | undefined {
  const first = items[0]
  if (!first) return undefined
  return first.kind === 'post' ? first.post.fullname : first.comment.fullname
}
