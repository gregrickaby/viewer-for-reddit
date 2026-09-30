import Image from 'next/image'
import icon from './snoo.svg'
import { SITE } from '@/lib/site'
import styles from './logo.module.css'

/**
 * Brand mark: the app icon, optionally with the site name beside it.
 * `withWordmark="wide"` shows the name only from 64rem up.
 */
export function Logo({
  size = 40,
  withWordmark = false,
  mark = true,
}: {
  size?: number
  withWordmark?: boolean | 'wide'
  /** Set to false for the name alone, when the mark sits elsewhere. */
  mark?: boolean
}) {
  return (
    <span className={styles.root}>
      {mark ? <Image className={styles.mark} src={icon} alt="" width={size} height={size} /> : null}
      {withWordmark ? (
        <span
          className={
            withWordmark === 'wide' ? `${styles.wordmark} ${styles.wide}` : styles.wordmark
          }
        >
          {SITE.name}
        </span>
      ) : null}
    </span>
  )
}
