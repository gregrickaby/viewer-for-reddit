import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'
import { SITE } from '@/lib/site'
import { SiteLinks } from './site-links'
import styles from './content-page.module.css'

/**
 * The frame for the public text pages (About, Donate): the brand, one
 * article, and the site links. Nothing here reads the session, so these
 * pages prerender and stay readable to search engines.
 */
export function ContentPage({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label={`${SITE.name} home`}>
          <Logo size={32} withWordmark />
        </Link>
      </header>
      <main className={styles.article}>{children}</main>
      <footer className={styles.footer}>
        <SiteLinks />
        <p className={styles.disclaimer}>
          {SITE.name} is an independent project, not affiliated with Reddit, Inc. “Reddit” and the
          Snoo logo are trademarks of Reddit, Inc.
        </p>
      </footer>
    </div>
  )
}
