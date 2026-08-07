import {act, renderHook} from '@/test-utils'
import {beforeEach, describe, expect, it} from 'vitest'
import type {RedditPost} from '@/lib/types/reddit'
import {useRecentPosts} from './useRecentPosts'

function makePost(overrides: Partial<RedditPost> = {}): RedditPost {
  return {
    id: 'post1',
    name: 't3_post1',
    title: 'Test post',
    author: 'someuser',
    subreddit: 'test',
    subreddit_name_prefixed: 'r/test',
    permalink: '/r/test/comments/post1/test_post/',
    created_utc: Date.now() / 1000,
    score: 10,
    num_comments: 2,
    selftext: '',
    selftext_html: '',
    thumbnail: '',
    url: 'https://reddit.com/r/test/comments/post1/',
    likes: null,
    saved: false,
    over_18: false,
    stickied: false,
    is_video: false,
    ups: 10,
    downs: 0,
    ...overrides
  }
}

describe('useRecentPosts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with an empty list', () => {
    const {result} = renderHook(() => useRecentPosts())

    expect(result.current.recentPosts).toEqual([])
  })

  it('adds a visited post to the top of the list', () => {
    const {result} = renderHook(() => useRecentPosts())

    act(() => {
      result.current.addRecentPost(makePost())
    })

    expect(result.current.recentPosts).toHaveLength(1)
    expect(result.current.recentPosts[0]).toMatchObject({
      id: 'post1',
      subredditPrefixed: 'r/test',
      title: 'Test post'
    })
  })

  it('moves a revisited post to the top instead of duplicating it', () => {
    const {result} = renderHook(() => useRecentPosts())

    act(() => {
      result.current.addRecentPost(makePost({id: 'post1', title: 'First'}))
      result.current.addRecentPost(makePost({id: 'post2', title: 'Second'}))
      result.current.addRecentPost(
        makePost({id: 'post1', title: 'First revisited'})
      )
    })

    expect(result.current.recentPosts).toHaveLength(2)
    expect(result.current.recentPosts[0].title).toBe('First revisited')
    expect(result.current.recentPosts[1].title).toBe('Second')
  })

  it('caps the list at 10 entries, dropping the oldest', () => {
    const {result} = renderHook(() => useRecentPosts())

    act(() => {
      for (let i = 0; i < 12; i++) {
        result.current.addRecentPost(
          makePost({id: `post${i}`, title: `Post ${i}`})
        )
      }
    })

    expect(result.current.recentPosts).toHaveLength(10)
    expect(result.current.recentPosts[0].id).toBe('post11')
    expect(result.current.recentPosts.at(-1)?.id).toBe('post2')
  })

  it('clears the list', () => {
    const {result} = renderHook(() => useRecentPosts())

    act(() => {
      result.current.addRecentPost(makePost())
    })
    expect(result.current.recentPosts).toHaveLength(1)

    act(() => {
      result.current.clearRecentPosts()
    })

    expect(result.current.recentPosts).toEqual([])
  })
})
