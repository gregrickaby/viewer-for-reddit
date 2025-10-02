import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Posts} from '@/components/Posts/Posts'
import {getSubreddit} from '@/lib/actions/getSubreddit'
import config from '@/lib/config'
import type {SearchParams, SortingOption, SubredditParams} from '@/lib/types'
import type {Metadata} from 'next'

/**
 * Generate metadata.
 */
export async function generateMetadata(props: {
  params: SubredditParams
}): Promise<Metadata> {
  const params = await props.params
  const subreddit = params.subreddit
  const data = await getSubreddit(subreddit)

  const title = data?.display_name
    ? `/r/${data.display_name} - ${config.siteName}`
    : `/r/${subreddit} - ${config.siteName}`

  const description =
    data?.public_description ||
    `Browse posts in /r/${subreddit} with Viewer for Reddit.`

  return {
    title,
    description,
    alternates: {
      canonical: `/r/${subreddit}`
    },
    robots: {
      index: true,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: `/r/${subreddit}`,
      images: [
        {
          url: data?.icon_img || '/social-share.webp',
          width: data?.icon_img ? 256 : 1200,
          height: data?.icon_img ? 256 : 630,
          alt: data?.display_name || config.siteName
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
      <Posts subreddit={subreddit} sort={sort} />
      <BossButton />
      <BackToTop />
    </>
  )
}
