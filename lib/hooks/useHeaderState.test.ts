import {act, renderHook} from '@/test-utils'
import {vi} from 'vitest'
import {useHeaderState} from './useHeaderState'

// Mock useMediaQuery
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: vi.fn()
}))

const mockUseMediaQuery = vi.mocked(
  await import('@mantine/hooks')
).useMediaQuery

describe('useHeaderState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMediaQuery.mockReturnValue(false)
  })

  it('returns correct showNavbar and showSearch from state', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: true,
        mobileSearchState: 'closed' as const,
        searchQuery: ''
      }
    }
    const {result, store} = renderHook(() => useHeaderState(), {preloadedState})
    expect(result.current.showNavbar).toBe(true)
    expect(result.current.showSearch).toBe(false)
    expect(result.current.isMobile).toBe(false)
    act(() => {
      result.current.toggleNavbarHandler()
      result.current.toggleSearchHandler()
    })
    const state = store.getState().transient
    expect(state.toggleNavbar).toBe(false)
    expect(state.mobileSearchState).toBe('open')
  })

  it('toggleNavbarHandler toggles state', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: false,
        mobileSearchState: 'closed' as const,
        searchQuery: ''
      }
    }
    const {result, store} = renderHook(() => useHeaderState(), {preloadedState})
    act(() => {
      result.current.toggleNavbarHandler()
    })
    expect(store.getState().transient.toggleNavbar).toBe(true)
  })

  it('toggleSearchHandler sets mobileSearchState', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: false,
        mobileSearchState: 'closed' as const,
        searchQuery: ''
      }
    }
    const {result, store} = renderHook(() => useHeaderState(), {preloadedState})
    act(() => {
      result.current.toggleSearchHandler()
    })
    expect(store.getState().transient.mobileSearchState).toBe('open')
  })

  it('toggleNavbarOnMobileHandler only toggles on mobile', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: true,
        mobileSearchState: 'closed' as const,
        searchQuery: ''
      }
    }

    mockUseMediaQuery.mockReturnValue(false)
    const {result: desktopResult, store: desktopStore} = renderHook(
      () => useHeaderState(),
      {preloadedState}
    )
    act(() => {
      desktopResult.current.toggleNavbarOnMobileHandler()
    })
    expect(desktopStore.getState().transient.toggleNavbar).toBe(true)

    mockUseMediaQuery.mockReturnValue(true)
    const {result: mobileResult, store: mobileStore} = renderHook(
      () => useHeaderState(),
      {preloadedState}
    )
    act(() => {
      mobileResult.current.toggleNavbarOnMobileHandler()
    })
    expect(mobileStore.getState().transient.toggleNavbar).toBe(false)
  })
})
