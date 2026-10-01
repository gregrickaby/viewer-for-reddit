import type { Route } from 'next'
import Link from 'next/link'
import styles from './back-link.module.css'

/** The "← Home" line above a page that has a natural place to go back to. */
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <Link href={href as Route} className={styles.link} transitionTypes={['nav-back']}>
        {`← ${children}`}
      </Link>
    </nav>
  )
}
