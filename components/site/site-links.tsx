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
      <Link className={linkClassName} href="/about">
        About
      </Link>
      <Link className={linkClassName} href="/donate">
        Donate
      </Link>
      <a
        className={linkClassName}
        href={SITE.links.github}
        rel="noopener noreferrer"
        target="_blank"
      >
        GitHub <span aria-hidden="true">↗</span>
      </a>
    </nav>
  )
}
