import {Breadcrumb} from '@/components/Breadcrumb/Breadcrumb'
import {SinglePost} from '@/components/SinglePost/SinglePost'
import {getSinglePost} from '@/lib/actions/getSinglePost'
import type {SinglePostPageParams} from '@/lib/types'
import {generatePostSlug} from '@/lib/utils/generatePostSlug'
import type {Metadata} from 'next'
import {redirect} from 'next/navigation'

/**
 * Generate metadata for the single post page.
 */
export async function generateMetadata({
  params
}: SinglePostPageParams): Promise<Metadata> {
  const {subreddit, postId} = await params
  const post = await getSinglePost(subreddit, postId)
  const title = `${post?.title} - r/${subreddit}`
  const slug = generatePostSlug(post?.title)
  const canonicalUrl = slug
    ? `/r/${subreddit}/comments/${postId}/${slug}/`
    : `/r/${subreddit}/comments/${postId}/`

  return {
    title,
    description: post?.title,
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: false,
      follow: true
    },
    openGraph: {
      title,
      description: post?.title,
      url: canonicalUrl,
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
 * This page component handles the route /r/[subreddit]/comments/[postId]/[[...slug]]
 * and renders a complete view of a single Reddit post including its comments.
 *
 * If the slug is missing or doesn't match the expected slug, it performs a 301 redirect
 * to the canonical URL with the proper slug for SEO purposes.
 *
 * @param params - Route parameters containing subreddit, postId, and optional slug
 * @returns Single post page with post content and comments, or redirects to canonical URL
 */
export default async function SinglePostPage({params}: SinglePostPageParams) {
  const {subreddit, postId, slug: slugParam} = await params
  const post = await getSinglePost(subreddit, postId)
  const expectedSlug = generatePostSlug(post?.title)

  // 301 redirect to canonical URL with slug if missing or incorrect
  if (expectedSlug) {
    const currentSlug = slugParam?.[0] || null
    if (!currentSlug || currentSlug !== expectedSlug) {
      redirect(`/r/${subreddit}/comments/${postId}/${expectedSlug}/`)
    }
  }

  const postUrl = expectedSlug
    ? `/r/${subreddit}/comments/${postId}/${expectedSlug}/`
    : `/r/${subreddit}/comments/${postId}/`

  return (
    <>
      <Breadcrumb
        items={[
          {label: `r/${subreddit}`, href: `/r/${subreddit}`},
          {
            label: post?.title || 'Post',
            href: postUrl
          }
        ]}
      />
      <SinglePost subreddit={subreddit} postId={postId} />
    </>
  )
}
