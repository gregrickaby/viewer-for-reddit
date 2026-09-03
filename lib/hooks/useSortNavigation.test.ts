import {act, renderHook} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSortNavigation} from './useSortNavigation'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

const mockUseRouter = vi.mocked(useRouter)

// Forces the isPending branch of the race-condition guards without racing
// real React transition timing.
let mockIsPending = false
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useTransition: () => [mockIsPending, (callback: () => void) => callback()]
  }
})

describe('useSortNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPending = false
    mockUseRouter.mockReturnValue({push: mockPush} as never)
  })

  it('omits the time param when the new sort does not support one', () => {
    const buildHref = vi.fn(({sort, time}: {sort: string; time?: string}) =>
      time ? `?sort=${sort}&time=${time}` : `?sort=${sort}`
    )
    const {result} = renderHook(() =>
      useSortNavigation({
        activeSort: 'top',
        activeTimeFilter: 'week',
        buildHref
      })
    )

    act(() => {
      result.current.handleSortChange('hot')
    })

    expect(buildHref).toHaveBeenCalledWith({sort: 'hot', time: undefined})
    expect(mockPush).toHaveBeenCalledWith('?sort=hot')
  })

  it('carries the active time filter when the new sort supports one', () => {
    const buildHref = ({sort, time}: {sort: string; time?: string}) =>
      time ? `?sort=${sort}&time=${time}` : `?sort=${sort}`
    const {result} = renderHook(() =>
      useSortNavigation({
        activeSort: 'new',
        activeTimeFilter: 'month',
        buildHref
      })
    )

    act(() => {
      result.current.handleSortChange('controversial')
    })

    expect(mockPush).toHaveBeenCalledWith('?sort=controversial&time=month')
  })

  it('always includes sort and the given time on handleTimeFilterChange', () => {
    const buildHref = ({sort, time}: {sort: string; time?: string}) =>
      `?sort=${sort}&time=${time}`
    const {result} = renderHook(() =>
      useSortNavigation({activeSort: 'top', buildHref})
    )

    act(() => {
      result.current.handleTimeFilterChange('year')
    })

    expect(mockPush).toHaveBeenCalledWith('?sort=top&time=year')
  })

  it('forwards navigateOptions to router.push', () => {
    const buildHref = ({sort}: {sort: string}) => `?sort=${sort}`
    const {result} = renderHook(() =>
      useSortNavigation({
        activeSort: 'hot',
        buildHref,
        navigateOptions: {scroll: false}
      })
    )

    act(() => {
      result.current.handleSortChange('new')
    })

    expect(mockPush).toHaveBeenCalledWith('?sort=new', {scroll: false})
  })

  it('ignores handleSortChange while a navigation is already pending', () => {
    mockIsPending = true
    const buildHref = vi.fn(() => '?sort=hot')
    const {result} = renderHook(() =>
      useSortNavigation({activeSort: 'top', buildHref})
    )

    act(() => {
      result.current.handleSortChange('hot')
    })

    expect(buildHref).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('ignores handleTimeFilterChange while a navigation is already pending', () => {
    mockIsPending = true
    const buildHref = vi.fn(() => '?sort=top&time=year')
    const {result} = renderHook(() =>
      useSortNavigation({activeSort: 'top', buildHref})
    )

    act(() => {
      result.current.handleTimeFilterChange('year')
    })

    expect(buildHref).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('skips navigation when buildHref returns a falsy value', () => {
    const buildHref = vi.fn(() => null)
    const {result} = renderHook(() =>
      useSortNavigation({activeSort: 'hot', buildHref})
    )

    act(() => {
      result.current.handleSortChange('new')
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
})
