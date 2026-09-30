import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ActiveSection } from '@/components/feed/active-section'
import { FeedSkeleton } from '@/components/feed/feed-section'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import styles from '../feed-page.module.css'

export const metadata: Metadata = { title: 'Active threads' }

export default function ActivePage() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <div>
          <h1 className={styles.title}>Active threads</h1>
          <p className={styles.subtitle}>
            The busiest game, match, and daily threads of the last 12 hours. Sorted by new, a thread
            updates as comments arrive.
          </p>
        </div>
        <SectionError title="Couldn’t load active threads">
          <Suspense
            fallback={
              <SkeletonExit>
                <FeedSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <ActiveSection />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
