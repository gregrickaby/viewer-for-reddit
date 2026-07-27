import {TabsSkeleton} from '@/components/skeletons/TabsSkeleton/TabsSkeleton'
import {PostListWithTabs} from '@/components/ui/PostListWithTabs/PostListWithTabs'
import {fetchPosts} from '@/lib/actions/reddit/posts'
import {appConfig} from '@/lib/config/app.config'
import {Container, Title} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

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
 * Resolves params/searchParams, then fetches and displays posts from a
 * custom multireddit.
 *
 * @param params - URL params promise (username, multireddit name)
 * @param searchParams - URL search params promise (sort option)
 */
async function MultiredditPosts({
  params,
  searchParams
}: Readonly<{
  params: PageProps['params']
  searchParams: PageProps['searchParams']
}>) {
  const {username, multiname} = await params
  const {sort, time} = await searchParams
  const postSort = (sort as SortOption) || 'hot'
  const timeFilter = time as TimeFilter | undefined

  const multiredditPath = `user/${username}/m/${multiname}`

  const {posts, after} = await fetchPosts(
    multiredditPath,
    postSort,
    undefined,
    timeFilter
  )

  return (
    <>
      <Title order={2} mb="lg">
        {multiname}
      </Title>
      <PostListWithTabs
        posts={posts}
        after={after}
        activeSort={postSort}
        activeTimeFilter={timeFilter}
        subreddit={multiredditPath}
      />
    </>
  )
}

/**
 * Multireddit page - displays posts from a user's custom multireddit.
 *
 * @param params - URL params (username, multireddit name)
 * @param searchParams - URL search params (sort option)
 */
export default function MultiredditPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  return (
    <Container size="lg">
      <Suspense fallback={<TabsSkeleton />}>
        <MultiredditPosts params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  )
}
