import {renderHook} from '@/test-utils/renderHook'
import {act} from '@testing-library/react'
import {useHeaderState} from './useHeaderState'

describe('useHeaderState', () => {
  it('returns correct showNavbar and showSearch from state', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: true,
        toggleSearch: false
      }
    }
    const {result, store} = renderHook(() => useHeaderState(), {preloadedState})
    expect(result.current.showNavbar).toBe(true)
    expect(result.current.showSearch).toBe(false)
    // Toggle both
    act(() => {
      result.current.toggleNavbarHandler()
      result.current.toggleSearchHandler()
    })
    const state = store.getState().transient
    expect(state.toggleNavbar).toBe(false)
    expect(state.toggleSearch).toBe(true)
  })

  it('toggleNavbarHandler toggles state', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: false,
        toggleSearch: false
      }
    }
    const {result, store} = renderHook(() => useHeaderState(), {preloadedState})
    act(() => {
      result.current.toggleNavbarHandler()
    })
    expect(store.getState().transient.toggleNavbar).toBe(true)
  })

  it('toggleSearchHandler toggles state', () => {
    const preloadedState = {
      transient: {
        toggleNavbar: false,
        toggleSearch: false
      }
    }
    const {result, store} = renderHook(() => useHeaderState(), {preloadedState})
    act(() => {
      result.current.toggleSearchHandler()
    })
    expect(store.getState().transient.toggleSearch).toBe(true)
  })
})
