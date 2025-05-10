import {
  useGetPopularSubredditsQuery,
  useGetSubredditPostsInfiniteQuery
} from '@/lib/store/services/publicApi'
import {renderHook, server, waitFor} from '@/test-utils'
import {http, HttpResponse} from 'msw'

describe('publicApi - getPopularSubreddits', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should fetch popular subreddits', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 2}))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('should sort popular subreddits by subscriber count', async () => {
    server.use(
      http.get('https://www.reddit.com/subreddits/popular.json', () => {
        return HttpResponse.json({
          data: {
            children: [
              {kind: 't5', data: {display_name: 'foo', subscribers: 5000}},
              {kind: 't5', data: {display_name: 'bar'}}
            ]
          }
        })
      })
    )

    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 2}))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const names = result.current.data?.data.children.map(
      (c) => c.data.display_name
    )
    expect(names).toEqual(['foo', 'bar'])
  })

  it('handles undefined children in popular subreddits response', async () => {
    server.use(
      http.get('https://www.reddit.com/subreddits/popular.json', () => {
        return HttpResponse.json({data: {}}) // children is undefined
      })
    )

    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 5}))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data.children).toEqual([]) // defaulted to []
  })

  it('handles missing data key in popular subreddit response', async () => {
    server.use(
      http.get('https://www.reddit.com/subreddits/popular.json', () => {
        return HttpResponse.json({})
      })
    )

    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 5}))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.data.children).toEqual([])
  })
})

describe('publicApi - getSubredditPosts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should fetch subreddit posts and filters out stickied ones', async () => {
    server.use(
      http.get('https://www.reddit.com/r/pics/hot.json', () => {
        return HttpResponse.json({
          data: {
            after: 't3_abc',
            children: [
              {kind: 't3', data: {id: '1', title: 'Post 1', stickied: false}},
              {kind: 't3', data: {id: '2', title: 'Stickied', stickied: true}},
              {kind: 't3', data: {id: '3', title: 'Post 3', stickied: false}}
            ]
          }
        })
      })
    )

    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'pics',
        sort: 'hot'
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const posts = result.current.data?.pages[0].data.children ?? []
    const titles = posts.map((p) => p.data.title)

    expect(titles).toEqual(['Post 1', 'Post 3'])
  })

  it('should return empty children array if none exist', async () => {
    server.use(
      http.get('https://www.reddit.com/r/pics/hot.json', () => {
        return HttpResponse.json({data: {after: null, children: []}})
      })
    )

    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'pics',
        sort: 'hot'
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0].data.children).toEqual([])
  })

  it('handles missing `after` token correctly', async () => {
    server.use(
      http.get('https://www.reddit.com/r/pics/new.json', () => {
        return HttpResponse.json({
          data: {
            children: [{kind: 't3', data: {id: '42', title: 'Only post'}}]
            // `after` key is missing
          }
        })
      })
    )

    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'pics',
        sort: 'new'
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const children = result.current.data?.pages[0].data.children
    expect(children?.[0].data.title).toBe('Only post')
  })
})
