import {searchSubreddits} from '@/lib/actions/reddit'
import {logger} from '@/lib/utils/logger'
import {act, renderHook, waitFor} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSearch} from './useSearch'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock searchSubreddits action
vi.mock('@/lib/actions/reddit', () => ({
  searchSubreddits: vi.fn()
}))

const mockSearchSubreddits = vi.mocked(searchSubreddits)

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const {result} = renderHook(() => useSearch())

    expect(result.current.query).toBe('')
    expect(result.current.groupedResults.communities).toEqual([])
    expect(result.current.groupedResults.nsfw).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasError).toBe(false)
    expect(result.current.errorMessage).toBeUndefined()
  })

  it('updates query state', () => {
    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    expect(result.current.query).toBe('test')
  })

  it('sets loading immediately for valid query length', () => {
    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('ab')
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('does not search when query is too short', async () => {
    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('a')
    })

    await new Promise((r) => setTimeout(r, 350))

    expect(mockSearchSubreddits).not.toHaveBeenCalled()
  })

  it('searches after debounce delay', async () => {
    mockSearchSubreddits.mockResolvedValueOnce({
      success: true,
      data: [
        {
          name: 'pics',
          displayName: 'r/pics',
          over18: false,
          subscribers: 1000000
        }
      ]
    })

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('pic')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(mockSearchSubreddits).toHaveBeenCalledWith('pic')
    })
  })

  it('groups results by NSFW status', async () => {
    mockSearchSubreddits.mockResolvedValueOnce({
      success: true,
      data: [
        {
          name: 'pics',
          displayName: 'r/pics',
          over18: false,
          subscribers: 1000000
        },
        {
          name: 'nsfw_sub',
          displayName: 'r/nsfw_sub',
          over18: true,
          subscribers: 50000
        },
        {
          name: 'videos',
          displayName: 'r/videos',
          over18: false,
          subscribers: 800000
        }
      ]
    })

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(result.current.groupedResults.communities).toHaveLength(2)
      expect(result.current.groupedResults.nsfw).toHaveLength(1)
    })

    expect(result.current.groupedResults.communities[0].name).toBe('pics')
    expect(result.current.groupedResults.nsfw[0].name).toBe('nsfw_sub')
  })

  it('handles API error response', async () => {
    mockSearchSubreddits.mockResolvedValueOnce({
      success: false,
      error: 'API error',
      data: []
    })

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(result.current.hasError).toBe(true)
      expect(result.current.errorMessage).toBe('API error')
      expect(result.current.groupedResults.communities).toEqual([])
    })
  })

  it('uses fallback error message when API provides none', async () => {
    mockSearchSubreddits.mockResolvedValueOnce({
      success: false,
      data: []
    })

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(result.current.errorMessage).toBe('Search failed')
    })
  })

  it('shows rate limit error for non-authenticated users', async () => {
    mockSearchSubreddits.mockResolvedValueOnce({
      success: false,
      error: 'Reddit rate limit exceeded. Log in to continue.',
      data: []
    })

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(result.current.hasError).toBe(true)
      expect(result.current.errorMessage).toBe(
        'Reddit rate limit exceeded. Log in to continue.'
      )
      expect(result.current.groupedResults.communities).toEqual([])
    })
  })

  it('shows rate limit error for authenticated users', async () => {
    mockSearchSubreddits.mockResolvedValueOnce({
      success: false,
      error: 'Reddit rate limit exceeded. Try again later.',
      data: []
    })

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(result.current.hasError).toBe(true)
      expect(result.current.errorMessage).toBe(
        'Reddit rate limit exceeded. Try again later.'
      )
      expect(result.current.groupedResults.communities).toEqual([])
    })
  })

  it('handles network errors', async () => {
    mockSearchSubreddits.mockRejectedValueOnce(new Error('Network down'))

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    await waitFor(() => {
      expect(result.current.hasError).toBe(true)
      expect(result.current.errorMessage).toBe(
        'Network error. Please try again.'
      )
    })
  })

  it('aborts in-flight request when query changes', async () => {
    const pendingPromise = new Promise(() => {})
    mockSearchSubreddits.mockReturnValueOnce(pendingPromise as never)

    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    act(() => {
      result.current.setQuery('tests')
    })

    await new Promise((r) => setTimeout(r, 350))

    expect(mockSearchSubreddits).toHaveBeenCalledTimes(2)
  })

  it('ignores aborted requests without logging errors', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    let rejectPromise: (error: Error) => void = () => {}

    mockSearchSubreddits.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectPromise = reject
      }) as never
    )

    const {result, unmount} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    unmount()

    await act(async () => {
      rejectPromise(new Error('aborted'))
      await Promise.resolve()
    })

    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('ignores resolved results after abort', async () => {
    let resolvePromise: (value: {success: boolean; data: []}) => void = () => {}
    mockSearchSubreddits.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      }) as never
    )

    const {result, unmount} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test')
    })

    await new Promise((r) => setTimeout(r, 350))

    unmount()

    await act(async () => {
      resolvePromise({success: true, data: []})
      await Promise.resolve()
    })

    expect(mockSearchSubreddits).toHaveBeenCalled()
  })

  it('navigates to subreddit on option select', () => {
    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.handleOptionSelect('r/pics')
    })

    expect(mockPush).toHaveBeenCalledWith('/r/pics')
    expect(result.current.query).toBe('')
  })

  it('navigates to search page on submit', () => {
    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('test query')
    })

    act(() => {
      result.current.handleSubmit()
    })

    expect(mockPush).toHaveBeenCalledWith('/search/test%20query')
    expect(result.current.query).toBe('')
  })

  it('does not submit empty query', () => {
    const {result} = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('   ')
    })

    act(() => {
      result.current.handleSubmit()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
})
