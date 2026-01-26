import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {fetchPosts} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Container, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

import {SortOption, TimeFilter} from '@/lib/types/reddit'

interface PageProps {
  searchParams: Promise<{sort?: string; time?: string}>
}

/**
 * Generate metadata for homepage.
 */
export const metadata: Metadata = {
  title: `${appConfig.site.name} - ${appConfig.site.description}`,
  description: appConfig.site.metaDescription,
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: appConfig.site.name,
    description: appConfig.site.metaDescription,
    url: appConfig.site.baseUrl,
    type: 'website',
    images: [
      {
        url: '/social-share.webp',
        width: 1200,
        height: 630,
        alt: appConfig.site.name
      }
    ]
  }
}

/**
 * Posts content component - fetches and displays posts for the feed.
 * Wrapped in Suspense with TabsSkeleton fallback.
 *
 * @param feedType - Type of feed ('home' for authenticated, 'popular' for guests)
 * @param isAuthenticated - Whether user is logged in
 * @param sort - Sort option (hot, new, top, rising, controversial)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function PostsContent({
  feedType,
  isAuthenticated,
  sort = 'hot',
  timeFilter
}: Readonly<{
  feedType: string
  isAuthenticated: boolean
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  const {posts, after} = await fetchPosts(feedType, sort, undefined, timeFilter)

  return (
    <PostListWithTabs
      posts={posts}
      after={after}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      isAuthenticated={isAuthenticated}
      subreddit={feedType}
    />
  )
}

/**
 * Homepage - displays personalized or popular feed.
 *
 * Features:
 * - Authenticated users: personalized home feed with subscriptions
 * - Unauthenticated users: popular posts from r/popular
 * - Sort tabs (hot, new, top, rising)
 * - Infinite scroll
 * - Boss button and back-to-top button
 *
 * @param searchParams - URL search params (sort option)
 */
export default async function Home({searchParams}: Readonly<PageProps>) {
  const {sort, time} = await searchParams
  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  // Show personalized home feed for authenticated users, popular for guests
  const feedType = isAuthenticated ? 'home' : 'popular'
  const feedTitle = isAuthenticated ? 'Your Feed' : 'Popular Posts'

  return (
    <Container size="lg">
      <div style={{maxWidth: '800px'}}>
        <Title order={2} mb="lg">
          {feedTitle}
        </Title>

        <Suspense fallback={<TabsSkeleton />}>
          <PostsContent
            feedType={feedType}
            isAuthenticated={isAuthenticated}
            sort={postSort}
            timeFilter={timeFilter}
          />
        </Suspense>
      </div>
    </Container>
  )
}
