import {Breadcrumb} from '@/components/Breadcrumb/Breadcrumb'
import {SinglePost} from '@/components/SinglePost/SinglePost'
import {getSinglePost} from '@/lib/actions/getSinglePost'
import type {SinglePostPageParams} from '@/lib/types'
import type {Metadata} from 'next'

/**
 * Generate metadata for the single post page.
 */
export async function generateMetadata({
  params
}: SinglePostPageParams): Promise<Metadata> {
  const {subreddit, postId} = await params
  const post = await getSinglePost(subreddit, postId)
  const title = `${post?.title} - r/${subreddit}`

  return {
    title,
    description: post?.title,
    alternates: {
      canonical: `/r/${subreddit}/comments/${postId}`
    },
    robots: {
      index: true,
      follow: true
    },
    openGraph: {
      title,
      description: post?.title,
      url: `/r/${subreddit}/comments/${postId}`,
      type: 'article',
      ...(post?.thumbnail &&
        post.thumbnail !== 'self' &&
        post.thumbnail !== 'default' && {
          images: [
            {
              url: post.thumbnail
            }
          ]
        })
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
  const post = await getSinglePost(subreddit, postId)

  return (
    <>
      <Breadcrumb
        items={[
          {label: `r/${subreddit}`, href: `/r/${subreddit}`},
          {
            label: post?.title || 'Post',
            href: `/r/${subreddit}/comments/${postId}`
          }
        ]}
      />
      <SinglePost subreddit={subreddit} postId={postId} />
    </>
  )
}
