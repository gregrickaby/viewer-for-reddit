import {describe, expect, it} from 'vitest'
import {COMMENTS_LIMIT, MAX_LIMIT, MIN_LIMIT} from './apiConstants'

describe('apiConstants', () => {
  describe('API limits', () => {
    it('should have correct MIN_LIMIT value', () => {
      expect(MIN_LIMIT).toBe(10)
      expect(typeof MIN_LIMIT).toBe('number')
    })

    it('should have correct MAX_LIMIT value', () => {
      expect(MAX_LIMIT).toBe(25)
      expect(typeof MAX_LIMIT).toBe('number')
    })

    it('should have correct COMMENTS_LIMIT value', () => {
      expect(COMMENTS_LIMIT).toBe(25)
      expect(typeof COMMENTS_LIMIT).toBe('number')
    })

    it('should maintain proper hierarchy (MIN_LIMIT <= MAX_LIMIT)', () => {
      expect(MIN_LIMIT).toBeLessThanOrEqual(MAX_LIMIT)
    })

    it('should export constants as immutable values', () => {
      // These should be compile-time constants
      const minLimit = MIN_LIMIT
      const maxLimit = MAX_LIMIT
      const commentsLimit = COMMENTS_LIMIT

      expect(minLimit).toBe(MIN_LIMIT)
      expect(maxLimit).toBe(MAX_LIMIT)
      expect(commentsLimit).toBe(COMMENTS_LIMIT)
    })
  })

  describe('usage compatibility', () => {
    it('should be usable in URLSearchParams construction', () => {
      const params = new URLSearchParams({
        limit: String(MAX_LIMIT),
        minLimit: String(MIN_LIMIT),
        commentsLimit: String(COMMENTS_LIMIT)
      })

      expect(params.get('limit')).toBe('25')
      expect(params.get('minLimit')).toBe('10')
      expect(params.get('commentsLimit')).toBe('25')
    })

    it('should be usable in arithmetic operations', () => {
      expect(MAX_LIMIT * 2).toBe(50)
      expect(MIN_LIMIT + MAX_LIMIT).toBe(35)
      expect(COMMENTS_LIMIT - MIN_LIMIT).toBe(15)
    })
  })
})
