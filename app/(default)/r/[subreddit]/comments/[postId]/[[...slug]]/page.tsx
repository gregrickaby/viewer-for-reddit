import {SinglePost} from '@/components/SinglePost/SinglePost'
import config from '@/lib/config'
import type {SinglePostPageParams} from '@/lib/types'
import type {Metadata} from 'next'

/**
 * Generate static metadata for single post pages.
 */
export async function generateMetadata({
  params
}: SinglePostPageParams): Promise<Metadata> {
  const {subreddit, postId} = await params
  const title = `Post in r/${subreddit} - ${config.siteName}`
  const description = `View post and comments in r/${subreddit}`
  const canonicalUrl = `/r/${subreddit}/comments/${postId}/`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
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
 * Single Post Page - displays a Reddit post with its comments
 *
 * This page component handles the route /r/[subreddit]/comments/[postId]/[[...slug]]
 * and renders a complete view of a single Reddit post including its comments.
 *
 * @param params - Route parameters containing subreddit, postId, and optional slug
 * @returns Single post page with post content and comments
 */
export default async function SinglePostPage({params}: SinglePostPageParams) {
  const {subreddit, postId} = await params

  return <SinglePost subreddit={subreddit} postId={postId} />
}
