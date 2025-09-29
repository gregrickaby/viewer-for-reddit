import {SinglePost} from '@/components/SinglePost/SinglePost'
import type {Metadata} from 'next'

// Try using Next.js official PageProps helper
export interface SinglePostPageProps {
  params: Promise<{subreddit: string; postId: string}>
}

/**
 * Generate metadata for the single post page.
 */
export async function generateMetadata({
  params
}: SinglePostPageProps): Promise<Metadata> {
  const {subreddit, postId} = await params

  return {
    title: `Post in r/${subreddit} - Reddit Viewer`,
    description: `View post ${postId} in r/${subreddit} subreddit`,
    openGraph: {
      title: `Post in r/${subreddit}`,
      description: `View post ${postId} in r/${subreddit} subreddit`,
      type: 'article'
    },
    twitter: {
      card: 'summary',
      title: `Post in r/${subreddit}`,
      description: `View post ${postId} in r/${subreddit} subreddit`
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
export default async function SinglePostPage({params}: SinglePostPageProps) {
  const {subreddit, postId} = await params

  return (
    <main>
      <SinglePost subreddit={subreddit} postId={postId} />
    </main>
  )
}
