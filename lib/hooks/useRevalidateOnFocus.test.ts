import {renderHook} from '@/test-utils'
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

const mockRefresh = vi.fn()
const mockUseRouter = vi.mocked(useRouter)

describe('useRevalidateOnFocus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('refreshes when the tab becomes visible after the threshold elapses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const {rerender} = renderHook(() => useRevalidateOnFocus(1000))

    mockVisibility = 'hidden'
    rerender()

    vi.setSystemTime(1500)
    mockVisibility = 'visible'
    rerender()

    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not refresh again on a later render without hiding first', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    const {rerender} = renderHook(() => useRevalidateOnFocus(1000))

    mockVisibility = 'hidden'
    rerender()

    vi.setSystemTime(1500)
    mockVisibility = 'visible'
    rerender()
    mockRefresh.mockClear()

    rerender()

    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
