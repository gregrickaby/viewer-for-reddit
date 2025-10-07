import {renderHook} from '@/test-utils'

import {useCommentData} from './useCommentData'

// Mock the RTK Query hooks
vi.mock('@/lib/store/services/commentsApi', async () => {
  const actual = await vi.importActual('@/lib/store/services/commentsApi')
  return {
    ...actual,
    useGetPostCommentsPagesInfiniteQuery: vi.fn(() => ({
      data: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false
    })),
    useGetPostCommentsPagesRawInfiniteQuery: vi.fn(() => ({
      data: null,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false
    })),
    useLazyGetPostCommentsQuery: vi.fn(() => [
      vi.fn(),
      {data: null, isLoading: false}
    ]),
    useLazyGetPostCommentsRawQuery: vi.fn(() => [
      vi.fn(),
      {data: null, isLoading: false}
    ])
  }
})

// Mock the helper functions
vi.mock('@/lib/utils/formatting/commentHelpers', () => ({
  getDisplayComments: vi.fn(() => []),
  getLoadingState: vi.fn(() => false),
  getNextPageControls: vi.fn(() => ({
    currentFetchNextPage: vi.fn(),
    currentHasNextPage: false,
    currentIsFetchingNextPage: false
  })),
  processInfiniteComments: vi.fn(() => []),
  processNestedComments: vi.fn(() => [])
}))

describe('useCommentData', () => {
  const defaultParams = {
    permalink: '/r/test/comments/123',
    open: true
  }

  it('should return initial state correctly', () => {
    const {result} = renderHook(() => useCommentData(defaultParams))

    expect(result.current.displayComments).toEqual([])
    expect(result.current.nestedComments).toEqual([])
    expect(result.current.showLoading).toBe(false)
    expect(result.current.hasCommentsToShow).toBe(false)
    expect(result.current.enableNestedComments).toBe(false)
    expect(result.current.enableInfiniteLoading).toBe(false)
  })

  it('should handle nested comments mode', () => {
    const {result} = renderHook(() =>
      useCommentData({
        ...defaultParams,
        enableNestedComments: true
      })
    )

    expect(result.current.enableNestedComments).toBe(true)
  })

  it('should handle infinite loading mode', () => {
    const {result} = renderHook(() =>
      useCommentData({
        ...defaultParams,
        enableInfiniteLoading: true
      })
    )

    expect(result.current.enableInfiniteLoading).toBe(true)
  })
})
