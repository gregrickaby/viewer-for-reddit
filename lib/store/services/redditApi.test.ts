import {
  useGetPopularSubredditsQuery,
  useGetSubredditAboutQuery,
  useGetSubredditPostsInfiniteQuery,
  useSearchSubredditsQuery
} from '@/lib/store/services/redditApi'
import {renderHook, waitFor} from '@/test-utils'

describe('redditApi', () => {
  it('should search subreddits', async () => {
    const {result} = renderHook(() =>
      useSearchSubredditsQuery({query: 'aww', enableNsfw: false})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.[0]?.display_name).toBe('aww')
  })

  it('should fetch subreddit about data', async () => {
    const {result} = renderHook(() => useGetSubredditAboutQuery('aww'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.display_name).toBe('aww')
  })

  it('should fetch popular subreddits', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 1}))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.[0]?.display_name).toBeDefined()
  })

  it('should fetch paginated subreddit posts', async () => {
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({subreddit: 'aww', sort: 'hot'})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const pages = result.current.data?.pages ?? []

    expect(pages.length).toBeGreaterThan(0)
    expect(pages[0]?.data?.children?.length).toBeGreaterThan(0)
    expect(pages[0]?.data?.children?.[0]?.data?.title).toBeDefined()
  })
})
