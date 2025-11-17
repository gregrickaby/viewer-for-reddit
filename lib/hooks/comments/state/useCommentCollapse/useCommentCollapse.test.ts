import {renderHook} from '@/test-utils'
import {act} from 'react'
import {useCommentCollapse} from './useCommentCollapse'

describe('useCommentCollapse', () => {
  it('should initialize with default collapsed state (false)', () => {
    const {result} = renderHook(() => useCommentCollapse())

    expect(result.current.isCollapsed).toBe(false)
  })

  it('should initialize with custom collapsed state', () => {
    const {result} = renderHook(() => useCommentCollapse(true))

    expect(result.current.isCollapsed).toBe(true)
  })

  it('should toggle collapse state from false to true', () => {
    const {result} = renderHook(() => useCommentCollapse(false))

    act(() => {
      result.current.toggleCollapse()
    })

    expect(result.current.isCollapsed).toBe(true)
  })

  it('should toggle collapse state from true to false', () => {
    const {result} = renderHook(() => useCommentCollapse(true))

    act(() => {
      result.current.toggleCollapse()
    })

    expect(result.current.isCollapsed).toBe(false)
  })

  it('should toggle multiple times correctly', () => {
    const {result} = renderHook(() => useCommentCollapse())

    expect(result.current.isCollapsed).toBe(false)

    act(() => {
      result.current.toggleCollapse()
    })
    expect(result.current.isCollapsed).toBe(true)

    act(() => {
      result.current.toggleCollapse()
    })
    expect(result.current.isCollapsed).toBe(false)

    act(() => {
      result.current.toggleCollapse()
    })
    expect(result.current.isCollapsed).toBe(true)
  })
})
