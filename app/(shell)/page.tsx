import {FeedContainer} from '@/components/layout/FeedContainer/FeedContainer'
import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {DirectionalTransition} from '@/components/ui/DirectionalTransition/DirectionalTransition'
import {LandingPage} from '@/components/ui/LandingPage/LandingPage'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {isAuthenticated} from '@/lib/auth/session'
import {fetchPosts} from '@/lib/actions/reddit/posts'
import {appConfig} from '@/lib/config/app.config'
import type {Metadata} from 'next'
import {Suspense} from 'react'

import {SortOption, TimeFilter} from '@/lib/types/reddit'

interface PageProps {
  searchParams: Promise<{sort?: string; time?: string; error?: string}>
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
    siteName: appConfig.site.name,
    images: [
      {
        url: '/social-share.webp',
        width: 1200,
        height: 630,
        alt: appConfig.site.name
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: appConfig.site.name,
    description: appConfig.site.metaDescription,
    images: ['/social-share.webp']
  },
  other: {
    'application-name': appConfig.site.name
  }
}

/**
 * Posts content component - fetches and displays posts for the authenticated home feed.
 *
 * @param sort - Sort option (hot, new, top, rising, controversial)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function PostsContent({
  sort = 'hot',
  timeFilter
}: Readonly<{
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  const {posts, after} = await fetchPosts('home', sort, undefined, timeFilter)

  return (
    <PostListWithTabs
      posts={posts}
      after={after}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      subreddit="home"
    />
  )
}

/**
 * Resolves auth state, then renders either the landing page or the
 * personalized feed. Reads `cookies()` via `isAuthenticated`, so the caller
 * wraps this in `<Suspense>` to keep the route prerenderable.
 *
 * @param searchParams - URL search params promise (sort option)
 */
async function HomeContent({
  searchParams
}: Readonly<{
  searchParams: PageProps['searchParams']
}>) {
  const authenticated = await isAuthenticated()
  const {sort, time, error} = await searchParams

  if (!authenticated) {
    return <LandingPage error={error} />
  }

  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  return (
    <DirectionalTransition>
      <FeedContainer>
        <Suspense fallback={<TabsSkeleton />}>
          <PostsContent sort={postSort} timeFilter={timeFilter} />
        </Suspense>
      </FeedContainer>
    </DirectionalTransition>
  )
}

/**
 * Homepage - shows landing page for unauthenticated users,
 * personalized feed for authenticated users.
 *
 * @param searchParams - URL search params (sort option)
 */
export default function Home({searchParams}: Readonly<PageProps>) {
  return (
    <Suspense
      fallback={
        <FeedContainer>
          <TabsSkeleton />
        </FeedContainer>
      }
    >
      <HomeContent searchParams={searchParams} />
    </Suspense>
  )
}
