import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Breadcrumb} from '@/components/Breadcrumb/Breadcrumb'
import {Posts} from '@/components/Posts/Posts'
import config from '@/lib/config'
import type {SearchParams, SortingOption, SubredditParams} from '@/lib/types'
import type {Metadata} from 'next'

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
      <Breadcrumb
        items={[{label: `r/${subreddit}`, href: `/r/${subreddit}`}]}
      />
      <Posts subreddit={subreddit} sort={sort} />
      <BossButton />
      <BackToTop />
    </>
  )
}
