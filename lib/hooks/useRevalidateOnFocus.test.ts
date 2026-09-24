import {act, renderHook} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {useRevalidateOnFocus} from './useRevalidateOnFocus'

let mockVisibility: DocumentVisibilityState = 'visible'

vi.mock('@mantine/hooks', () => ({
  useDocumentVisibility: () => mockVisibility
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

const mockRevalidateFeeds = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/actions/reddit/revalidate', () => ({
  revalidateFeeds: () => mockRevalidateFeeds()
}))

const mockRefresh = vi.fn()
const mockUseRouter = vi.mocked(useRouter)

describe('useRevalidateOnFocus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRevalidateFeeds.mockResolvedValue(undefined)
    mockVisibility = 'visible'
    mockUseRouter.mockReturnValue({
      refresh: mockRefresh
    } as unknown as ReturnType<typeof useRouter>)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not refresh on mount', () => {
    renderHook(() => useRevalidateOnFocus(1000))

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('does not refresh when the tab becomes visible before the threshold elapses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const {rerender} = renderHook(() => useRevalidateOnFocus(1000))

    mockVisibility = 'hidden'
    rerender()

    vi.setSystemTime(500)
    mockVisibility = 'visible'
    rerender()

    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('revalidates the posts cache tag then refreshes when the tab becomes visible after the threshold elapses', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const {rerender} = renderHook(() => useRevalidateOnFocus(1000))

    mockVisibility = 'hidden'
    rerender()

    vi.setSystemTime(1500)
    mockVisibility = 'visible'
    rerender()

    await act(async () => {
      await Promise.resolve()
    })
    expect(mockRevalidateFeeds).toHaveBeenCalledTimes(1)
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not refresh again on a later render without hiding first', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const {rerender} = renderHook(() => useRevalidateOnFocus(1000))

    mockVisibility = 'hidden'
    rerender()

    vi.setSystemTime(1500)
    mockVisibility = 'visible'
    rerender()
    await act(async () => {
      await Promise.resolve()
    })
    mockRefresh.mockClear()

    rerender()

    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
