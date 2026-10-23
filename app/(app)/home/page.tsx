import type { Metadata } from 'next'
import { Suspense } from 'react'

import styles from '@/app/(app)/feed-page.module.css'
import { FeedSection, FeedSkeleton } from '@/components/feed/feed-section'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { HOME_SORTS } from '@/lib/url-state'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage({ searchParams }: PageProps<'/home'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <h1 className={styles.title}>Home</h1>
        <SectionError title="Couldn't load your home feed">
          <Suspense
            fallback={
              <SkeletonExit>
                <FeedSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <FeedSection
                base="/home"
                searchParams={searchParams}
                showSubreddit
                sorts={HOME_SORTS}
                source={{ type: 'home' }}
              />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
