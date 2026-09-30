import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { LiveSection, LiveSkeleton } from '@/components/live/live-section'
import styles from '../../feed-page.module.css'

type Props = PageProps<'/live/[id]'>

export const metadata: Metadata = { title: 'Live thread' }

export default function LivePage({ params, searchParams }: Props) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <SectionError title="Couldn’t load this live thread">
          <Suspense
            fallback={
              <SkeletonExit>
                <LiveSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <div className={styles.page}>
                <LiveSection params={params} searchParams={searchParams} />
              </div>
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
