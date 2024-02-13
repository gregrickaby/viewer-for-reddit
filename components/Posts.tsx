'use client'

import Media from '@/components/Media'
import {RedditPostResponse} from '@/lib/types'
import Masonry from 'react-masonry-css'

/**
 * The posts component.
 */
export default function Posts(posts: RedditPostResponse) {
  // No posts? Bail.
  if (posts.error || !posts.data) {
    return null
  }

  return (
    <Masonry
      breakpointCols={{
        default: 4,
        1660: 3,
        1024: 2,
        768: 1
      }}
      className="mb-12 flex gap-12"
      columnClassName="flex flex-col gap-12 not-prose"
    >
      {posts.data.children.length > 0 &&
        posts.data.children.map(({data}) => (
          <div
            className="flex flex-col gap-4 rounded border p-6 pt-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-700"
            key={data.id}
          >
            <a
              className="block text-sm leading-none lg:text-base"
              href={`https://www.reddit.com${data.permalink}`}
              rel="noopener noreferrer"
            >
              {data.title}
            </a>
            <Media {...data} />
          </div>
        ))}
    </Masonry>
  )
}