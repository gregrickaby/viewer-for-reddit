import {SinglePost} from '@/components/SinglePost/SinglePost'
import type {SinglePostPageParams} from '@/lib/types'
import type {Metadata} from 'next'

/**
 * Generate metadata for the single post page.
 */
export async function generateMetadata({
  params
}: SinglePostPageParams): Promise<Metadata> {
  const {subreddit, postId} = await params

  return {
    title: `Post in r/${subreddit} - Reddit Viewer`,
    description: `View post ${postId} in ${subreddit} community`,
    openGraph: {
      title: `Post in r/${subreddit}`,
      description: `View post ${postId} in ${subreddit} community`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `Post in r/${subreddit}`,
      description: `View post ${postId} in ${subreddit} community`
    }
  }
}

/**
 * Single Post Page - displays a Reddit post with its comments
 *
 * This page component handles the route /r/[subreddit]/comments/[postId]
 * and renders a complete view of a single Reddit post including its comments.
 *
 * Route examples:
 * - /r/programming/comments/abc123
 * - /r/javascript/comments/xyz789
 *
 * @param params - Route parameters containing subreddit and postId
 * @returns Single post page with post content and comments
 */
export default async function SinglePostPage({params}: SinglePostPageParams) {
  const {subreddit, postId} = await params

  return (
    <main>
      <SinglePost subreddit={subreddit} postId={postId} />
    </main>
  )
}
