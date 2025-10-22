import {Subreddit} from '@/components/Feeds/Subreddit/Subreddit'
import BackToTop from '@/components/UI/BackToTop/BackToTop'
import BossButton from '@/components/UI/BossButton/BossButton'
import {Breadcrumb} from '@/components/UI/Breadcrumb/Breadcrumb'
import config from '@/lib/config'
import type {SearchParams, SortingOption, SubredditParams} from '@/lib/types'
import {Container} from '@mantine/core'
import type {Metadata} from 'next'
import {Suspense} from 'react'

/**
 * Generate static metadata for subreddit pages.
 */
export async function generateMetadata(props: {
  params: SubredditParams
}): Promise<Metadata> {
  const params = await props.params
  const subreddit = params.subreddit

  const title = `r/${subreddit} - ${config.siteName}`
  const description = `Browse posts in r/${subreddit} with Viewer for Reddit.`

  return {
    title,
    description,
    alternates: {
      canonical: `/r/${subreddit}`
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: `/r/${subreddit}`,
      images: [
        {
          url: '/social-share.webp',
          width: 1200,
          height: 630,
          alt: config.siteName
        }
      ]
    }
  }
}

/**
 * The single subreddit page.
 */
export default async function Page(props: {
  params: SubredditParams
  searchParams: SearchParams
}) {
  const params = await props.params
  const subreddit = params.subreddit
  const searchParams = await props.searchParams
  const sort = searchParams.sort as SortingOption

  return (
    <>
      <Container size="md">
        <Breadcrumb
          items={[{label: params.subreddit, href: `/${params.subreddit}`}]}
        />
        <Suspense fallback={null}>
          <Subreddit subreddit={subreddit} sort={sort} />
        </Suspense>
      </Container>
      <BossButton />
      <BackToTop />
    </>
  )
}
