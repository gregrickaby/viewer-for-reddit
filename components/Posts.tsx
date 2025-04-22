'use client'

import Media from '@/components/Media'
import {formatNumber, getTimeAgo, sanitizeText} from '@/lib/functions'
import type {RedditPostResponse} from '@/lib/types'
import React, {useMemo} from 'react'
import {FaArrowUp, FaClock, FaComment, FaUser} from 'react-icons/fa'
import Masonry from 'react-masonry-css'

/**
 * The posts component.
 */
export default function Posts(props: Readonly<RedditPostResponse>) {
  // Define the breakpoint columns.
  const breakpointCols = useMemo(
    () => ({
      default: 3,
      1024: 2,
      768: 1
    }),
    []
  )

  return (
    <Masonry
      breakpointCols={breakpointCols}
      className="mb-12 flex gap-12"
      columnClassName="flex flex-col gap-12 "
    >
      {props?.data?.children.map(({data}, index) => (
        <React.Fragment key={data.id}>
          <article
            className="flex flex-col gap-4 rounded border p-6 pt-4 text-sm shadow-xl dark:border-zinc-800 dark:bg-zinc-700"
            key={data.id}
          >
            <header className="flex gap-4 text-left">
              <div className="flex flex-col items-center gap-0">
                <FaArrowUp height={18} width={18} />
                <span className="text-base font-bold">
                  {formatNumber(data.score)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <a
                  className="text-base leading-tight font-bold"
                  href={`https://www.reddit.com${data.permalink}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {sanitizeText(data.title)}
                </a>
                <div className="flex gap-2 text-xs">
                  <a
                    className="flex items-center gap-1"
                    href={`https://www.reddit.com/u/${sanitizeText(data.author)}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <FaUser height={16} width={16} />
                    u/{sanitizeText(data.author)}
                  </a>
                  <a
                    className="flex items-center gap-1"
                    href={`https://www.reddit.com${data.permalink}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <FaComment height={16} width={16} />
                    {formatNumber(data.num_comments)}
                  </a>
                  <time className="flex items-center gap-1">
                    <FaClock height={16} width={16} />
                    {getTimeAgo(data.created_utc)}
                  </time>
                </div>
              </div>
            </header>
            <Media {...data} />
            <a
              className="button"
              href={data.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              View on Reddit
            </a>
          </article>
        </React.Fragment>
      ))}
    </Masonry>
  )
}
