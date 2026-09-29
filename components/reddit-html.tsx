import type { SafeHtml } from '@/lib/view-models'
import styles from './reddit-html.module.css'

/**
 * The only place Reddit HTML reaches the page (design §7, §8.9). It accepts
 * `SafeHtml` alone, which only the sanitizer can produce.
 */
export function RedditHtml({ html, className }: { html: SafeHtml; className?: string }) {
  const classes = className ? `${styles.root} ${className}` : styles.root
  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />
}
