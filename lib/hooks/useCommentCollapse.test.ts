import {act, renderHook} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {useCommentCollapse} from './useCommentCollapse'

describe('useCommentCollapse', () => {
  describe('initialization', () => {
    it('starts with isCollapsed as false', () => {
      const {result} = renderHook(() => useCommentCollapse())

      expect(result.current.isCollapsed).toBe(false)
    })
  })

  describe('toggleCollapse', () => {
    it('toggles isCollapsed from false to true', () => {
      const {result} = renderHook(() => useCommentCollapse())

      expect(result.current.isCollapsed).toBe(false)

      act(() => {
        result.current.toggleCollapse()
      })

      expect(result.current.isCollapsed).toBe(true)
    })

    it('toggles isCollapsed from true to false', () => {
      const {result} = renderHook(() => useCommentCollapse())

      act(() => {
        result.current.toggleCollapse()
      })

      expect(result.current.isCollapsed).toBe(true)

      act(() => {
        result.current.toggleCollapse()
      })

      expect(result.current.isCollapsed).toBe(false)
    })

    it('toggles multiple times correctly', () => {
      const {result} = renderHook(() => useCommentCollapse())

      // Start: false
      expect(result.current.isCollapsed).toBe(false)

      // Toggle 1: true
      act(() => {
        result.current.toggleCollapse()
      })
      expect(result.current.isCollapsed).toBe(true)

      // Toggle 2: false
      act(() => {
        result.current.toggleCollapse()
      })
      expect(result.current.isCollapsed).toBe(false)

      // Toggle 3: true
      act(() => {
        result.current.toggleCollapse()
      })
      expect(result.current.isCollapsed).toBe(true)

      // Toggle 4: false
      act(() => {
        result.current.toggleCollapse()
      })
      expect(result.current.isCollapsed).toBe(false)
    })
  })

  describe('independence', () => {
    it('maintains separate state for multiple instances', () => {
      const {result: result1} = renderHook(() => useCommentCollapse())
      const {result: result2} = renderHook(() => useCommentCollapse())

      // Both start collapsed
      expect(result1.current.isCollapsed).toBe(false)
      expect(result2.current.isCollapsed).toBe(false)

      // Toggle first instance
      act(() => {
        result1.current.toggleCollapse()
      })

      // Only first instance should be collapsed
      expect(result1.current.isCollapsed).toBe(true)
      expect(result2.current.isCollapsed).toBe(false)

      // Toggle second instance
      act(() => {
        result2.current.toggleCollapse()
      })

      // Both should now be collapsed
      expect(result1.current.isCollapsed).toBe(true)
      expect(result2.current.isCollapsed).toBe(true)
    })
  })
})
