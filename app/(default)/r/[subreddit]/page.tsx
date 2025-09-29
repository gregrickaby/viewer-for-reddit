import BackToTop from '@/components/BackToTop/BackToTop'
import BossButton from '@/components/BossButton/BossButton'
import {Posts} from '@/components/Posts/Posts'
import config from '@/lib/config'
import type {SearchParams, SortingOption, SubredditParams} from '@/lib/types'

/**
 * Generate metadata.
 */
export async function generateMetadata(props: {params: SubredditParams}) {
  const params = await props.params
  const subreddit = params.subreddit

  return {
    title: `/r/${subreddit} - ${config.siteName}`,
    description: `Browse posts in /r/${subreddit} anonymously with Viewer for Reddit.`,
    alternates: {
      canonical: `${config.siteUrl}r/${subreddit}`
    },
    openGraph: {
      title: `/r/${subreddit} - ${config.siteName}`,
      description: `Posts in /r/${subreddit}, updated in real time.`,
      url: `${config.siteUrl}r/${subreddit}`,
      images: [
        {
          url: `${config.siteUrl}social-share.webp`,
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
      <Posts subreddit={subreddit} sort={sort} />
      <BossButton />
      <BackToTop />
    </>
  )
}
