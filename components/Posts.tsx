'use client'

import Media from '@/components/Media'
import {formatNumber, getTimeAgo} from '@/lib/functions'
import {RedditPostResponse} from '@/lib/types'
import {
  IconArrowUp,
  IconClock,
  IconMessage,
  IconUser
} from '@tabler/icons-react'
import {decode} from 'html-entities'
import Masonry from 'react-masonry-css'

/**
 * The posts component.
 */
export default function Posts({data}: RedditPostResponse) {
  return data && data.children.length > 0 ? (
    <Masonry
      breakpointCols={{default: 3, 1024: 2, 768: 1}}
      className="mb-12 flex gap-12"
      columnClassName="flex flex-col gap-12 not-prose"
    >
      {data.children.map(({data}) => (
        <article
          className="flex flex-col gap-4 rounded border p-6 pt-4 text-sm shadow-xl dark:border-zinc-800 dark:bg-zinc-700"
          key={data.id}
        >
          <header className="flex gap-4 text-left">
            <div className="flex flex-col items-center gap-0">
              <IconArrowUp height={18} width={18} />
              <span className="text-base font-bold">
                {formatNumber(data.score)}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <a
                className="text-base font-bold leading-tight"
                href={`https://www.reddit.com${data.permalink}`}
                rel="noopener noreferrer"
              >
                {decode(data.title)}
              </a>
              <div className="flex gap-2 text-xs">
                <a
                  className="flex items-center gap-1"
                  href={`https://www.reddit.com/u/${decode(data.author)}`}
                  rel="noopener noreferrer"
                >
                  <IconUser height={16} width={16} />
                  u/{decode(data.author)}
                </a>
                <a
                  className="flex items-center gap-1"
                  href={`https://www.reddit.com${data.permalink}`}
                  rel="noopener noreferrer"
                >
                  <IconMessage height={16} width={16} />
                  {formatNumber(data.num_comments)}
                </a>
                <time className="flex items-center gap-1">
                  <IconClock height={16} width={16} />
                  {getTimeAgo(data.created_utc)}
                </time>
              </div>
            </div>
          </header>
          <Media {...data} />
        </article>
      ))}
    </Masonry>
  ) : null
}
