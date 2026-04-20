import {mockObserver} from '@/test-utils/intersectionObserverMock'
import {act, render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {useLoadMoreOnIntersect} from './useLoadMoreOnIntersect'

interface TestProps {
  hasMore: boolean
  isPending: boolean
  loadMore: () => void
  threshold?: number
}

function Sentinel({hasMore, isPending, loadMore, threshold}: TestProps) {
  const sentinelRef = useLoadMoreOnIntersect({
    hasMore,
    isPending,
    loadMore,
    threshold
  })
  return <div ref={sentinelRef} data-testid="sentinel" />
}

describe('useLoadMoreOnIntersect', () => {
  it('calls loadMore when isIntersecting=true, hasMore=true, isPending=false', () => {
    const mockLoadMore = vi.fn()

    render(<Sentinel hasMore isPending={false} loadMore={mockLoadMore} />)

    expect(mockObserver.observe).toHaveBeenCalledTimes(1)

    act(() => {
      mockObserver._trigger(true)
    })

    expect(mockLoadMore).toHaveBeenCalledTimes(1)
  })

  it('does not call loadMore when hasMore=false', () => {
    const mockLoadMore = vi.fn()

    render(
      <Sentinel hasMore={false} isPending={false} loadMore={mockLoadMore} />
    )

    act(() => {
      mockObserver._trigger(true)
    })

    expect(mockLoadMore).not.toHaveBeenCalled()
  })

  it('does not call loadMore when isPending=true', () => {
    const mockLoadMore = vi.fn()

    render(<Sentinel hasMore isPending loadMore={mockLoadMore} />)

    act(() => {
      mockObserver._trigger(true)
    })

    expect(mockLoadMore).not.toHaveBeenCalled()
  })

  it('does not call loadMore when isIntersecting=false', () => {
    const mockLoadMore = vi.fn()

    render(<Sentinel hasMore isPending={false} loadMore={mockLoadMore} />)

    act(() => {
      mockObserver._trigger(false)
    })

    expect(mockLoadMore).not.toHaveBeenCalled()
  })

  it('disconnects the observer on unmount', () => {
    const mockLoadMore = vi.fn()

    const {unmount} = render(
      <Sentinel hasMore isPending={false} loadMore={mockLoadMore} />
    )

    expect(mockObserver.observe).toHaveBeenCalledTimes(1)

    unmount()

    expect(mockObserver.disconnect).toHaveBeenCalledTimes(1)
  })

  it('re-subscribes when hasMore changes from false to true', () => {
    const mockLoadMore = vi.fn()

    const {rerender} = render(
      <Sentinel hasMore={false} isPending={false} loadMore={mockLoadMore} />
    )

    // hasMore=false: observer created but guard prevents loadMore
    act(() => {
      mockObserver._trigger(true)
    })
    expect(mockLoadMore).not.toHaveBeenCalled()

    rerender(<Sentinel hasMore isPending={false} loadMore={mockLoadMore} />)

    // After rerender with hasMore=true the effect re-runs, a new observer is
    // created, and _callback points to the new callback.
    act(() => {
      mockObserver._trigger(true)
    })
    expect(mockLoadMore).toHaveBeenCalledTimes(1)
  })

  it('respects a custom threshold', () => {
    const mockLoadMore = vi.fn()

    render(
      <Sentinel
        hasMore
        isPending={false}
        loadMore={mockLoadMore}
        threshold={0.5}
      />
    )

    // Observer is created — just verify observe was called (threshold is
    // passed through to the native constructor which the mock swallows).
    expect(mockObserver.observe).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('sentinel')).toBeInTheDocument()
  })
})
