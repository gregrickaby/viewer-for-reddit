import { Logo } from '@/components/brand/logo'
import styles from './app-preview.module.css'

const SORTS = ['Best', 'Hot', 'New', 'Top', 'Rising'] as const

/** Invented posts: the preview shows the layout, so it needs no one else's content. */
const POSTS = [
  {
    votes: '2.4k',
    title: 'I rebuilt my grandfather’s workbench from reclaimed oak',
    meta: 'r/woodworking · 5h · 184 comments',
    thumb: true,
  },
  {
    votes: '1.1k',
    title: 'What small habit made your mornings better?',
    meta: 'r/AskReddit · 3h · 962 comments',
    thumb: false,
  },
  {
    votes: '864',
    title: 'My home server now runs on a Raspberry Pi and a spare hard drive',
    meta: 'r/selfhosted · 7h · 73 comments',
    thumb: true,
  },
] as const

/**
 * A drawn sketch of the signed-in feed, built from the site's own tokens so it
 * follows light and dark mode. One label describes it; the parts are hidden.
 */
export function AppPreview() {
  return (
    <div
      className={styles.frame}
      role="img"
      aria-label="A preview of the home feed in Viewer for Reddit, with sort tabs and three posts"
    >
      <div className={styles.bar}>
        <Logo size={22} />
        <span className={styles.search}>Search subreddits…</span>
      </div>
      <div className={styles.tabs}>
        {SORTS.map((sort, index) => (
          <span key={sort} className={index === 0 ? `${styles.tab} ${styles.active}` : styles.tab}>
            {sort}
          </span>
        ))}
      </div>
      <ul className={styles.posts} role="list">
        {POSTS.map((post) => (
          <li key={post.title} className={styles.post}>
            <span className={styles.votes}>
              <span className={styles.arrow}>▲</span>
              {post.votes}
            </span>
            <span className={styles.body}>
              <span className={styles.title}>{post.title}</span>
              <span className={styles.meta}>{post.meta}</span>
            </span>
            {post.thumb ? <span className={styles.thumb} /> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
