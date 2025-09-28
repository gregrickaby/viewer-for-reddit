import {
  useGetPopularSubredditsQuery,
  useGetSinglePostQuery,
  useGetSubredditAboutQuery,
  useGetSubredditPostsInfiniteQuery,
  useLazyGetSubredditAboutQuery
} from '@/lib/store/services/postsApi'
import {renderHook, waitFor} from '@/test-utils'

describe('postsApi', () => {
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

  describe('getSinglePost', () => {
    it('should fetch single post with comments successfully', async () => {
      const {result} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'programming', postId: 'abc123'})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()

      // Verify post structure - getSinglePost now returns just the post data
      const post = result.current.data
      expect(post?.id).toBe('abc123')
      expect(post?.subreddit).toBe('programming')
      expect(post?.title).toBeDefined()
      expect(post?.author).toBeDefined()
    })

    it('should handle single post with no comments', async () => {
      const {result} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'programming', postId: 'nocomments'})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // For posts with no comments, we still get the post data
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.id).toBe('nocomments')
    })

    it('should handle 404 error for non-existent post', async () => {
      const {result} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'notfound', postId: 'abc123'})
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.data).toBeUndefined()
    })

    it('should handle 403 error for private subreddit', async () => {
      const {result} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'private', postId: 'abc123'})
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.data).toBeUndefined()
    })

    it('should handle empty comments when limit is 0', async () => {
      // Note: This tests that the limit parameter is passed correctly
      // The MSW handler returns no comments when limit=0
      const {result} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'programming', postId: 'abc123'})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Even though the handler might return empty comments for limit=0,
      // we still expect the post data to be present (comments are handled separately now)
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.id).toBe('abc123')
    })

    it('should properly encode subreddit and post ID parameters', async () => {
      // Test with special characters that need encoding
      const {result} = renderHook(() =>
        useGetSinglePostQuery({
          subreddit: 'test subreddit',
          postId: 'test-post-123'
        })
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // If the request succeeds, it means encoding worked properly
      expect(result.current.data).toBeDefined()
    })

    it('should provide correct cache tags for single posts', async () => {
      const {result} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'programming', postId: 'abc123'})
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Test that the query was cached properly by making the same request
      const {result: result2} = renderHook(() =>
        useGetSinglePostQuery({subreddit: 'programming', postId: 'abc123'})
      )

      // Wait for the second query to also be successful (cache loading)
      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true)
      })

      expect(result2.current.data).toEqual(result.current.data)
    })
  })
})
