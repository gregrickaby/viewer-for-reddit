import Link from 'next/link'
import { SITE } from '@/lib/site'
import styles from './site-links.module.css'

/**
 * About, Donate, and the source on GitHub. Static, so it renders in the
 * prerendered shell. The sidebar passes its own list and link classes.
 */
export function SiteLinks({
  className = styles.links,
  linkClassName,
}: {
  className?: string
  linkClassName?: string
}) {
  return (
    <nav aria-label="About this site" className={className}>
      <Link href="/about" className={linkClassName}>
        About
      </Link>
      <Link href="/donate" className={linkClassName}>
        Donate
      </Link>
      <a
        href={SITE.links.github}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub <span aria-hidden="true">↗</span>
      </a>
    </nav>
  )
}
