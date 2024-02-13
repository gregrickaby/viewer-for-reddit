import {fetchSubredditPosts} from '@/lib/actions'
import BackToTop from '@/components/BackToTop'
import Posts from '@/components/Posts'
import config from '@/lib/config'
import {PageProps} from '@/lib/types'
import type {Metadata} from 'next'
import Link from 'next/link'
import BossButton from '@/components/BossButton'

/**
 * Generate metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  return {
    title: `${config.siteName} - ${params.slug}`,
    description: `The latest posts from the ${params.slug} subreddit`,
    alternates: {
      canonical: `${config.siteUrl}r/${params.slug}`
    },
    openGraph: {
      description: `The latest posts from the ${params.slug} subreddit`,
      url: `${config.siteUrl}r/${params.slug}`
    }
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
  const sort = props.searchParams.sort || config.redditApi.sort
  let after = props.searchParams.after || ''

  // Fetch the subreddit posts.
  const posts = await fetchSubredditPosts({slug, sort, limit, after})

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
    <div className="posts relative text-center">
      <h2 className="mt-0">
        Viewing <span className="italic">{slug}</span>
      </h2>
      <Posts {...posts} />
      <Link
        className="button"
        href={{
          pathname: `/r/${slug}`,
          query: {
            after: posts.data.after,
            sort
          }
        }}
        prefetch={true}
      >
        Load More
      </Link>
      <BossButton />
      <BackToTop />
    </div>
  )
}
