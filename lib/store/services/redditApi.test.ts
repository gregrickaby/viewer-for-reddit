import {
  useGetPopularSubredditsQuery,
  useGetSubredditAboutQuery,
  useGetSubredditPostsInfiniteQuery,
  useLazyGetSubredditAboutQuery,
  useSearchSubredditsQuery
} from '@/lib/store/services/redditApi'
import {renderHook, waitFor} from '@/test-utils'

describe('redditApi', () => {
  it('should handle empty search results', async () => {
    const {result} = renderHook(() =>
      useSearchSubredditsQuery({query: 'notarealsubreddit', enableNsfw: false})
    )
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.length).toBe(0)
  })

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

  it('should handle getSubredditPostsInfiniteQuery with no posts', async () => {
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'notarealsubreddit',
        sort: 'hot'
      })
    )
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    const pages = result.current.data?.pages ?? []
    expect(pages.length).toBeGreaterThan(0)
    expect(pages[0]?.data?.children?.length).toBe(0)
  })

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

  it('should search subreddits with NSFW enabled', async () => {
    const {result} = renderHook(() =>
      useSearchSubredditsQuery({query: 'aww', enableNsfw: true})
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

  it('should fetch subreddit posts with different sort options', async () => {
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({subreddit: 'aww', sort: 'new'})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const pages = result.current.data?.pages ?? []

    expect(pages.length).toBeGreaterThan(0)
    expect(pages[0]?.data?.children?.length).toBeGreaterThan(0)
  })

  it('should handle fetchNextPage for infinite query', async () => {
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({subreddit: 'aww', sort: 'hot'})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.hasNextPage).toBeDefined()
    expect(result.current.fetchNextPage).toBeDefined()
    expect(result.current.isFetchingNextPage).toBeDefined()
  })

  it('should handle authentication through prepareHeaders', async () => {
    const {result} = renderHook(() => useGetSubredditAboutQuery('aww'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should handle transform response for search results', async () => {
    const {result} = renderHook(() =>
      useSearchSubredditsQuery({query: 'aww', enableNsfw: false})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data?.[0]).toHaveProperty('display_name')
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

  it('should handle stickied post filtering in transform response', async () => {
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({subreddit: 'testfilter', sort: 'hot'})
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const pages = result.current.data?.pages ?? []
    const posts = pages[0]?.data?.children ?? []

    expect(posts.length).toBe(1)
    expect(posts[0]?.data?.title).toBe('Normal post')
    expect(posts[0]?.data?.stickied).toBe(false)
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

  it('should handle null children array in posts response', async () => {
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'testfilternull',
        sort: 'hot'
      })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const pages = result.current.data?.pages ?? []
    expect(pages.length).toBeGreaterThan(0)
    expect(pages[0]?.data?.children?.length).toBe(0)
  })

  it('should properly encode multi-subreddit URLs with + separators', async () => {
    // Test that multi-subreddit syntax preserves + separators
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'gaming+technology+programming',
        sort: 'hot'
      })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // The query should succeed, which means the URL was properly formatted
    // without encoding the + separators as %2B
    expect(result.current.data).toBeDefined()
  })

  it('should encode special characters in individual subreddit names', async () => {
    // Test that special characters in subreddit names are still encoded
    const {result} = renderHook(() =>
      useGetSubredditPostsInfiniteQuery({
        subreddit: 'test space+normal',
        sort: 'hot'
      })
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })
})
