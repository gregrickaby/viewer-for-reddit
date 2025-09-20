import {act, renderHook} from '@/test-utils'
import {useHeaderState} from './useHeaderState'

describe('useHeaderState', () => {
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
})
