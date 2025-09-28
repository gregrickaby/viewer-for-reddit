import {useGetUserCommentsInfiniteQuery} from '@/lib/store/services/commentsApi'
import {
  useGetUserPostsInfiniteQuery,
  useGetUserProfileQuery
} from '@/lib/store/services/userApi'
import {renderHook} from '@/test-utils'
import {waitFor} from '@testing-library/react'

describe('Reddit API User Endpoints', () => {
  it('should fetch user profile successfully', async () => {
    const {result} = renderHook(() => useGetUserProfileQuery('testuser'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      id: '2cf0dc',
      name: 'testuser',
      created: 1234567890.0,
      created_utc: 1234567890.0,
      link_karma: 12345,
      comment_karma: 67890,
      total_karma: 80235,
      is_employee: false,
      is_friend: false,
      is_moderator: false,
      is_gold: false,
      is_mod: false,
      has_verified_email: true,
      icon_img:
        'https://styles.redditmedia.com/t5_abcde/styles/profileIcon_default.jpg',
      verified: true,
      subreddit: expect.objectContaining({
        display_name: 'u_testuser',
        public_description: 'A test user for mocking'
      })
    })
  })

  it('should handle user not found error', async () => {
    const {result} = renderHook(() => useGetUserProfileQuery('nonexistentuser'))

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('should fetch user posts with infinite query', async () => {
    const {result} = renderHook(() => useGetUserPostsInfiniteQuery('testuser'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages).toHaveLength(1)
    expect(result.current.data?.pages[0]).toEqual(
      expect.objectContaining({
        kind: 'Listing',
        data: expect.objectContaining({
          after: 't3_xyz789',
          children: expect.arrayContaining([
            expect.objectContaining({
              kind: 't3',
              data: expect.objectContaining({
                title: "User's first test post",
                author: 'testuser'
              })
            })
          ])
        })
      })
    )
  })

  it('should fetch user comments with infinite query', async () => {
    const {result} = renderHook(() =>
      useGetUserCommentsInfiniteQuery('testuser')
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.pages).toHaveLength(1)
    expect(result.current.data?.pages[0]).toEqual(
      expect.objectContaining({
        kind: 'Listing',
        data: expect.objectContaining({
          after: 't1_xyz789',
          children: expect.arrayContaining([
            expect.objectContaining({
              kind: 't1',
              data: expect.objectContaining({
                body: 'This is a test comment from the user',
                author: 'testuser'
              })
            })
          ])
        })
      })
    )
  })

  it('should handle empty user posts', async () => {
    const {result} = renderHook(() => useGetUserPostsInfiniteQuery('emptyuser'))

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // eslint-disable-next-line testing-library/no-node-access
    const children = result.current.data?.pages[0].data?.children
    expect(children).toBeDefined()
    expect(children).toHaveLength(0)
  })

  it('should handle empty user comments', async () => {
    const {result} = renderHook(() =>
      useGetUserCommentsInfiniteQuery('emptyuser')
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // eslint-disable-next-line testing-library/no-node-access
    const children = result.current.data?.pages[0].data?.children
    expect(children).toBeDefined()
    expect(children).toHaveLength(0)
  })
})
