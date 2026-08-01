import type {Metadata} from 'next'
import {PostThread, generatePostThreadMetadata} from '../PostThread'

interface PageProps {
  params: Promise<{
    subreddit: string
    postId: string
    slug: string
    commentId: string
  }>
  searchParams: Promise<{sort?: string}>
}

/**
 * Generate static metadata for single comment pages.
 */
export function generateMetadata({params}: PageProps): Promise<Metadata> {
  return generatePostThreadMetadata(params)
}

/**
 * Comment permalink page - displays a single post with a focused comment thread.
 *
 * @param params - URL params (subreddit, postId, slug, commentId)
 * @param searchParams - URL search params (comment sort option)
 */
export default function CommentPage({
  params,
  searchParams
}: Readonly<PageProps>) {
  return <PostThread params={params} searchParams={searchParams} />
}
