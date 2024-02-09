import {fetchSubredditPosts} from '@/app/actions'
import BackToTop from '@/app/r/[slug]/components/BackToTop'
import Posts from '@/app/r/[slug]/components/Posts'
import config from '@/lib/config'
import {PageProps} from '@/lib/types'
import type {Metadata} from 'next'
import Link from 'next/link'

/**
 * Generate metadata for the single subreddit route.
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  return {
    title: `${config.siteName} - ${params.slug}`,
    description: `The latest posts from the r/${params.slug} subreddit`
  }
}

/**
 * The single subreddit route.
 */
export default async function Page(props: PageProps) {
  // Get the params.
  const slug = props.params.slug || config.redditApi.sub

  // Get the search parameters.
  const limit = props.searchParams.limit || config.redditApi.limit
  const sortBy = props.searchParams.sortBy || config.redditApi.sortBy
  let after = props.searchParams.after || ''

  // Fetch the subreddit posts.
  const posts = await fetchSubredditPosts({slug, sortBy, limit, after})

  // Error? Bail.
  if (posts.error || !posts.data) {
    return (
      <div className="text-center">
        <h2>Uh oh!</h2>
        <pre>{posts.error}</pre>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2>{slug}</h2>
      <Posts {...posts} />
      <Link
        className="button hover"
        href={{pathname: `/r/${slug}`, query: {after: posts.data.after}}}
      >
        Load More
      </Link>
      <BackToTop />
    </div>
  )
}
