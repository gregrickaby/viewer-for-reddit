import {describe, expect, it} from 'vitest'
import {detectSwipe} from './touch-gestures'

describe('detectSwipe', () => {
  describe('right swipe detection', () => {
    it('detects valid right swipe', () => {
      const result = detectSwipe(50, 100, 200, 100)

      expect(result).toEqual({
        direction: 'right',
        deltaX: 150,
        deltaY: 0
      })
    })

    it('returns null when below threshold', () => {
      const result = detectSwipe(50, 100, 100, 100, 100)

      expect(result).toBeNull()
    })

    it('returns null when exactly at threshold', () => {
      const result = detectSwipe(50, 100, 150, 100, 100)

      expect(result).toBeNull()
    })

    it('detects when one pixel over threshold', () => {
      const result = detectSwipe(49, 100, 150, 100, 100)

      expect(result).not.toBeNull()
      expect(result?.direction).toBe('right')
      expect(result?.deltaX).toBe(101)
    })
  })

  describe('left swipe detection', () => {
    it('detects valid left swipe', () => {
      const result = detectSwipe(200, 100, 50, 100)

      expect(result).toEqual({
        direction: 'left',
        deltaX: 150,
        deltaY: 0
      })
    })

    it('returns null when below threshold', () => {
      const result = detectSwipe(100, 100, 50, 100, 100)

      expect(result).toBeNull()
    })
  })

  describe('vertical movement constraints', () => {
    it('returns null when vertical movement exceeds limit', () => {
      const result = detectSwipe(50, 100, 200, 160, 100, 50)

      expect(result).toBeNull()
    })

    it('detects when vertical movement is within limit', () => {
      const result = detectSwipe(50, 100, 200, 130, 100, 50)

      expect(result).not.toBeNull()
      expect(result?.direction).toBe('right')
      expect(result?.deltaY).toBe(30)
    })

    it('returns null when exactly at maxVerticalMovement', () => {
      const result = detectSwipe(50, 100, 200, 150, 100, 50)

      expect(result).toBeNull()
    })

    it('handles negative vertical movement', () => {
      const result = detectSwipe(50, 100, 200, 70, 100, 50)

      expect(result).not.toBeNull()
      expect(result?.deltaY).toBe(30)
    })

    it('respects custom maxVerticalMovement', () => {
      const result = detectSwipe(50, 100, 200, 130, 100, 20)

      expect(result).toBeNull()
    })
  })

  describe('custom thresholds', () => {
    it('respects custom threshold', () => {
      const result = detectSwipe(50, 100, 140, 100, 50)

      expect(result).not.toBeNull()
      expect(result?.direction).toBe('right')
    })

    it('works with very large threshold', () => {
      const result = detectSwipe(0, 100, 500, 100, 200)

      expect(result).not.toBeNull()
      expect(result?.deltaX).toBe(500)
    })
  })

  describe('edge cases', () => {
    it('handles zero start position', () => {
      const result = detectSwipe(0, 0, 150, 0)

      expect(result).not.toBeNull()
      expect(result?.direction).toBe('right')
    })

    it('handles negative coordinates', () => {
      const result = detectSwipe(-100, -50, 50, -50)

      expect(result).not.toBeNull()
      expect(result?.direction).toBe('right')
      expect(result?.deltaX).toBe(150)
    })

    it('handles very large swipe distances', () => {
      const result = detectSwipe(0, 100, 1000, 100)

      expect(result).not.toBeNull()
      expect(result?.deltaX).toBe(1000)
    })

    it('handles perfectly horizontal swipe', () => {
      const result = detectSwipe(50, 100, 200, 100)

      expect(result).not.toBeNull()
      expect(result?.deltaY).toBe(0)
    })
  })
})
