import type {Metadata} from 'next'
import {PostThread, generatePostThreadMetadata} from './PostThread'

interface PageProps {
  params: Promise<{
    subreddit: string
    postId: string
    slug: string
  }>
  searchParams: Promise<{sort?: string}>
}

/**
 * Generate static metadata for single post pages.
 */
export function generateMetadata({params}: PageProps): Promise<Metadata> {
  return generatePostThreadMetadata(params)
}

/**
 * Post page - displays a single post with comments.
 *
 * @param params - URL params (subreddit, postId, slug)
 * @param searchParams - URL search params (comment sort option)
 */
export default function PostPage({params, searchParams}: Readonly<PageProps>) {
  return <PostThread params={params} searchParams={searchParams} />
}
