'use client'

import {Post} from '@/lib/types'
import {useRedditContext} from './RedditContext'

export default function Card() {
  const {posts} = useRedditContext()

  return (
    <div>
      {!!posts.posts &&
        !!posts.posts.length &&
        posts.posts.map((post: Post) => (
          <div key={post.id}>
            <a href={post.permalink}>
              <img src={post.thumbnail} alt={post.title} />
              <h3>{post.title}</h3>
            </a>
          </div>
        ))}
    </div>
  )
}
