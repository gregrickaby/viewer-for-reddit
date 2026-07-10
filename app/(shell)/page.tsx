import {LandingPage} from '@/components/ui/LandingPage/LandingPage'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {fetchPosts} from '@/lib/actions/reddit/posts'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Container, Title} from '@mantine/core'
import type {Metadata} from 'next'

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
      isAuthenticated
      subreddit="home"
    />
  )
}

/**
 * Homepage - displays landing page for guests or personalized feed for authenticated users.
 *
 * @param searchParams - URL search params (sort option)
 */
export default async function Home({searchParams}: Readonly<PageProps>) {
  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  if (!isAuthenticated) {
    return <LandingPage />
  }

  const {sort, time} = await searchParams
  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  return (
    <Container size="lg">
      <div style={{maxWidth: '800px'}}>
        <Title order={2} mb="lg">
          Your Feed
        </Title>

        <PostsContent sort={postSort} timeFilter={timeFilter} />
      </div>
    </Container>
  )
}
