import styles from './logo.module.css'

/** Brand mark: an upvote arrow in a Reddit-orangered tile. */
export function Logo({
  size = 40,
  withWordmark = false,
}: {
  size?: number
  withWordmark?: boolean
}) {
  return (
    <span className={styles.root}>
      <svg
        className={styles.mark}
        width={size}
        height={size}
        viewBox="0 0 40 40"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="40" height="40" rx="11" />
        <path d="M20 9 30 21h-6v10h-8V21h-6z" />
      </svg>
      {withWordmark ? <span className={styles.wordmark}>Reddit Viewer</span> : null}
    </span>
  )
}
