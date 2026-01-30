import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {fetchPosts} from '@/lib/actions/reddit'
import {getSession} from '@/lib/auth/session'
import {appConfig} from '@/lib/config/app.config'
import {Container, Title} from '@mantine/core'
import type {Metadata} from 'next'

import {SortOption, TimeFilter} from '@/lib/types/reddit'

interface PageProps {
  params: Promise<{
    username: string
    multiname: string
  }>
  searchParams: Promise<{sort?: string; time?: string}>
}

/**
 * Generate metadata for multireddit page.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {username, multiname} = await params

  return {
    title: `${multiname} - ${appConfig.site.name}`,
    description: `Viewing posts from multireddit "${multiname}"`,
    alternates: {
      canonical: `/user/${username}/m/${multiname}`
    },
    robots: {
      index: false,
      follow: false
    },
    openGraph: {
      title: `${multiname} - ${appConfig.site.name}`,
      description: `Viewing posts from multireddit "${multiname}"`,
      url: `/user/${username}/m/${multiname}`
    }
  }
}

/**
 * Multireddit posts component.
 * Fetches and displays posts from a custom multireddit.
 *
 * @param username - Reddit username who owns the multireddit
 * @param multiname - Multireddit name
 * @param isAuthenticated - Whether user is logged in
 * @param sort - Sort option (hot, new, top, rising, controversial)
 * @param timeFilter - Time filter for top/controversial (hour, day, week, month, year, all)
 */
async function MultiredditPosts({
  username,
  multiname,
  isAuthenticated,
  sort = 'hot',
  timeFilter
}: Readonly<{
  username: string
  multiname: string
  isAuthenticated: boolean
  sort?: SortOption
  timeFilter?: TimeFilter
}>) {
  const multiredditPath = `user/${username}/m/${multiname}`

  const {posts, after} = await fetchPosts(
    multiredditPath,
    sort,
    undefined,
    timeFilter
  )

  return (
    <PostListWithTabs
      posts={posts}
      after={after}
      activeSort={sort}
      activeTimeFilter={timeFilter}
      isAuthenticated={isAuthenticated}
      subreddit={multiredditPath}
    />
  )
}

/**
 * Multireddit page - displays posts from a user's custom multireddit.
 *
 * Multireddits are custom feeds combining multiple subreddits.
 * Users can create, edit, and manage multireddits on Reddit.
 *
 * Features:
 * - Posts from all subreddits in the multireddit
 * - Sort tabs (hot, new, top, rising)
 * - Infinite scroll
 * - Boss button and back-to-top button
 *
 * @param params - URL params (username, multireddit name)
 * @param searchParams - URL search params (sort option)
 */
export default async function MultiredditPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  const {username, multiname} = await params
  const {sort, time} = await searchParams
  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  const session = await getSession()
  const isAuthenticated = !!session.accessToken

  return (
    <Container size="lg">
      <Title order={2} mb="lg">
        {multiname}
      </Title>

      <MultiredditPosts
        username={username}
        multiname={multiname}
        isAuthenticated={isAuthenticated}
        sort={postSort}
        timeFilter={timeFilter}
      />
    </Container>
  )
}
