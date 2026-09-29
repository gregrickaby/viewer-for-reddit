import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getUsername } from '@/lib/auth/session'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Home' }

async function Greeting() {
  const username = await getUsername()
  return <p className={styles.lede}>Signed in as u/{username}.</p>
}

// Phase 1 placeholder: the feed arrives in Phase 3 (docs/implementation.md).
export default function HomePage() {
  return (
    <section className={styles.root}>
      <h1 className={styles.title}>Home</h1>
      <Suspense fallback={<p className={`skeleton ${styles.lineSkeleton}`} aria-busy="true" />}>
        <Greeting />
      </Suspense>
    </section>
  )
}
