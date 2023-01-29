'use client'

import {Post} from '@/lib/types'
import {useRedditContext} from './RedditContext'

/**
 * Card component.
 */
export default function Card() {
  const {posts} = useRedditContext()

  return (
    <>
      {!!posts.posts &&
        !!posts.posts.length &&
        posts.posts.map((post: Post, index: number) => (
          <article key={post.id}>
            <h2>
              <a href={post.permalink}>{post.title}</a>
            </h2>
            <a href={post.permalink}>
              <img
                alt={post.title}
                decoding="async"
                height={post.images.cropped.height}
                loading={index < 1 ? 'eager' : 'lazy'}
                src={post.images.cropped.url}
                width={post.images.cropped.width}
                style={{backgroundColor: '#434343'}}
              />
            </a>
          </article>
        ))}
    </>
  )
}
