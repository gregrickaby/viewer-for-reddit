import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeedSection, FeedSkeleton } from '@/components/feed/feed-section'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { HOME_SORTS } from '@/lib/url-state'
import styles from '../feed-page.module.css'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage({ searchParams }: PageProps<'/home'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <h1 className={styles.title}>Home</h1>
        <SectionError title="Couldn’t load your home feed">
          <Suspense
            fallback={
              <SkeletonExit>
                <FeedSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <FeedSection
                source={{ type: 'home' }}
                base="/home"
                sorts={HOME_SORTS}
                searchParams={searchParams}
                showSubreddit
              />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
