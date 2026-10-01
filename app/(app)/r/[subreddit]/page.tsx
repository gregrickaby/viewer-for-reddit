import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeedSection, FeedSkeleton } from '@/components/feed/feed-section'
import { SectionError } from '@/components/islands/section-error'
import { PageTransition, Reveal, SkeletonExit } from '@/components/motion/transitions'
import { SubredditHeader, SubredditHeaderSkeleton } from '@/components/subreddit/subreddit-header'
import { BackLink } from '@/components/ui/back-link'
import { LISTING_SORTS } from '@/lib/url-state'
import styles from '../../feed-page.module.css'

export async function generateMetadata({ params }: PageProps<'/r/[subreddit]'>): Promise<Metadata> {
  const { subreddit } = await params
  return { title: `r/${subreddit}` }
}

async function SubredditFeed({
  params,
  searchParams,
}: Pick<PageProps<'/r/[subreddit]'>, 'params' | 'searchParams'>) {
  const { subreddit } = await params
  return (
    <FeedSection
      source={{ type: 'subreddit', name: subreddit }}
      base={`/r/${subreddit}`}
      sorts={LISTING_SORTS}
      searchParams={searchParams}
      // r/popular and r/all mix communities, so their cards name the subreddit.
      showSubreddit={['popular', 'all'].includes(subreddit.toLowerCase())}
    />
  )
}

export default function SubredditPage({ params, searchParams }: PageProps<'/r/[subreddit]'>) {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <SectionError title="Couldn’t load this community">
          <Suspense
            fallback={
              <SkeletonExit>
                <SubredditHeaderSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <SubredditHeader params={params} />
            </Reveal>
          </Suspense>
        </SectionError>
        <SectionError title="Couldn’t load posts">
          <Suspense
            fallback={
              <SkeletonExit>
                <FeedSkeleton />
              </SkeletonExit>
            }
          >
            <Reveal>
              <SubredditFeed params={params} searchParams={searchParams} />
            </Reveal>
          </Suspense>
        </SectionError>
      </div>
    </PageTransition>
  )
}
