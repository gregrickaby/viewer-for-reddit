import {act, renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {SidebarProvider, useSidebar} from './SidebarContext'

describe('useSidebar', () => {
  it('throws when used outside SidebarProvider', () => {
    expect(() => {
      renderHook(() => useSidebar())
    }).toThrow('useSidebar must be used within a SidebarProvider')
  })

  it('returns initial state with mobile closed and desktop open', () => {
    const {result} = renderHook(() => useSidebar(), {
      wrapper: SidebarProvider
    })

    expect(result.current.mobileOpen).toBe(false)
    expect(result.current.desktopOpen).toBe(true)
  })

  it('toggles mobile state', () => {
    const {result} = renderHook(() => useSidebar(), {
      wrapper: SidebarProvider
    })

    expect(result.current.mobileOpen).toBe(false)

    act(() => {
      result.current.toggleMobile()
    })

    expect(result.current.mobileOpen).toBe(true)

    act(() => {
      result.current.toggleMobile()
    })

    expect(result.current.mobileOpen).toBe(false)
  })

  it('toggles desktop state', () => {
    const {result} = renderHook(() => useSidebar(), {
      wrapper: SidebarProvider
    })

    expect(result.current.desktopOpen).toBe(true)

    act(() => {
      result.current.toggleDesktop()
    })

    expect(result.current.desktopOpen).toBe(false)

    act(() => {
      result.current.toggleDesktop()
    })

    expect(result.current.desktopOpen).toBe(true)
  })

  it('closes mobile sidebar', () => {
    const {result} = renderHook(() => useSidebar(), {
      wrapper: SidebarProvider
    })

    act(() => {
      result.current.toggleMobile()
    })

    expect(result.current.mobileOpen).toBe(true)

    act(() => {
      result.current.closeMobile()
    })

    expect(result.current.mobileOpen).toBe(false)
  })

  it('closeMobile is a no-op when already closed', () => {
    const {result} = renderHook(() => useSidebar(), {
      wrapper: SidebarProvider
    })

    expect(result.current.mobileOpen).toBe(false)

    act(() => {
      result.current.closeMobile()
    })

    expect(result.current.mobileOpen).toBe(false)
  })

  it('mobile and desktop states are independent', () => {
    const {result} = renderHook(() => useSidebar(), {
      wrapper: SidebarProvider
    })

    act(() => {
      result.current.toggleMobile()
    })

    expect(result.current.mobileOpen).toBe(true)
    expect(result.current.desktopOpen).toBe(true)

    act(() => {
      result.current.toggleDesktop()
    })

    expect(result.current.mobileOpen).toBe(true)
    expect(result.current.desktopOpen).toBe(false)
  })
})
