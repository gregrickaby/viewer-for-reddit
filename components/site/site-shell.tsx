import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/logo'
import { DISCLAIMER, SITE } from '@/lib/site'
import { SiteLinks } from './site-links'
import styles from './site.module.css'

/**
 * The frame for every page a signed-out reader can open (landing, About,
 * Donate, 404): the brand and page links on top, the site links and Reddit
 * disclaimer below. Nothing here reads the session, so these pages prerender.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={`${styles.inner} ${styles.header}`}>
        <Link href="/" className={styles.brand} aria-label={`${SITE.name} home`}>
          <Logo size={32} withWordmark />
        </Link>
        <nav aria-label="Site" className={styles.nav}>
          <Link href="/about">About</Link>
          <Link href="/donate">Donate</Link>
          <a
            href={SITE.links.github}
            className={styles.navExtra}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main>{children}</main>

      <footer className={`${styles.inner} ${styles.footer}`}>
        <SiteLinks />
        <p className={styles.disclaimer}>{DISCLAIMER}</p>
      </footer>
    </div>
  )
}
