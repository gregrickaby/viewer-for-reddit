import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { ThreadSection, ThreadSkeleton } from '@/components/thread/thread-section'
import styles from '../../../../../feed-page.module.css'

type Props = PageProps<'/r/[subreddit]/comments/[id]/[[...rest]]'>

/** The title comes from the URL slug, so metadata needs no Reddit call. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subreddit, rest } = await params
  const slug = rest?.[0]?.replace(/_/g, ' ').trim()
  return { title: slug ? `${slug} · r/${subreddit}` : `r/${subreddit}` }
}

export default function PostPage({ params, searchParams }: Props) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <SectionError title="Couldn’t load this post">
          <Suspense
            fallback={
              <SkeletonExit>
                <ThreadSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <div className={styles.page}>
                <ThreadSection params={params} searchParams={searchParams} />
              </div>
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
