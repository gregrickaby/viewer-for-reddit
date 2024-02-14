import About from '@/components/About'
import BackToTop from '@/components/BackToTop'
import BossButton from '@/components/BossButton'
import Posts from '@/components/Posts'
import {fetchSubredditPosts} from '@/lib/actions'
import config from '@/lib/config'
import {PageProps} from '@/lib/types'
import type {Metadata} from 'next'
import Link from 'next/link'

/**
 * Generate metadata.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  return {
    title: `${config.siteName} - r/${params.slug}`,
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

  // No media? Bail.
  if (posts.data.children.length === 0) {
    return (
      <div className="text-center">
        <h2>No media found</h2>
        <p>Try a different subreddit.</p>
      </div>
    )
  }

  return (
    <div className="posts relative text-center">
      <About slug={slug} />
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
