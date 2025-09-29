import {
  useGetPopularSubredditsQuery,
  useGetSubredditAboutQuery,
  useLazyGetSubredditAboutQuery
} from '@/lib/store/services/subredditApi'
import {renderHook, waitFor} from '@/test-utils'

describe('subredditApi', () => {
  it('should handle getSubredditAbout error', async () => {
    const {result} = renderHook(() =>
      useGetSubredditAboutQuery('notarealsubreddit')
    )
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.data).toBeUndefined()
  })

  it('should handle getPopularSubreddits with no results', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 0}))
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.length).toBe(0)
  })

  it('should fetch subreddit about data', async () => {
    const {result} = renderHook(() => useGetSubredditAboutQuery('aww'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.display_name).toBe('aww')
  })

  it('should use lazy subreddit about query', async () => {
    const {result} = renderHook(() => useLazyGetSubredditAboutQuery())

    expect(result.current[1].isLoading).toBe(false)
    expect(result.current[1].data).toBeUndefined()

    await waitFor(() => {
      result.current[0]('aww')
    })

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true)
    })

    expect(result.current[1].data?.display_name).toBe('aww')
  })

  it('should fetch popular subreddits', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 1}))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.[0]?.display_name).toBeDefined()
  })

  it('should fetch popular subreddits with default limit', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({}))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.length).toBeGreaterThan(0)
    expect(result.current.data?.[0]?.display_name).toBeDefined()
  })

  it('should handle authentication through prepareHeaders', async () => {
    const {result} = renderHook(() => useGetSubredditAboutQuery('aww'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should handle transform response for popular subreddits', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 25}))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(Array.isArray(result.current.data)).toBe(true)
    const data = result.current.data ?? []

    if (data.length > 1) {
      expect((data[0]?.subscribers ?? 0) >= (data[1]?.subscribers ?? 0)).toBe(
        true
      )
    }
  })

  it('should handle popular subreddits sorting with missing subscriber counts', async () => {
    const {result} = renderHook(() =>
      useGetPopularSubredditsQuery({limit: 999})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const data = result.current.data ?? []
    expect(data.length).toBe(4)

    expect(data[0]?.display_name).toBe('test1')
    expect(data[1]?.display_name).toBe('test3')
    const lastTwoNames = [data[2]?.display_name, data[3]?.display_name]
    expect(lastTwoNames).toContain('test2')
    expect(lastTwoNames).toContain('test4')
  })

  it('should provide empty tags when popular subreddits result is empty', async () => {
    const {result} = renderHook(() => useGetPopularSubredditsQuery({limit: 0}))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.length).toBe(0)
  })
})
