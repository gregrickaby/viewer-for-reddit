import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import {describe, expect, it} from 'vitest'
import {sortComments, type CommentSortingOption} from './commentSorter'

/**
 * Tests for commentSorter utility.
 *
 * Covers:
 * - All sorting algorithms (best, top, new, controversial, old, qa)
 * - Edge cases (empty arrays, single comment, equal scores/times)
 * - Immutability (original array not modified)
 */
describe('commentSorter', () => {
  /**
   * Helper to create mock comment with minimal required fields.
   */
  const createComment = (
    id: string,
    ups: number,
    created_utc: number
  ): AutoCommentData =>
    ({
      id,
      ups,
      created_utc,
      author: `user_${id}`,
      body: `Comment ${id}`
    }) as AutoCommentData

  const comments: AutoCommentData[] = [
    createComment('1', 10, 1000), // Moderate score, oldest
    createComment('2', 50, 3000), // High score, newest
    createComment('3', 5, 2000) // Low score, middle time
  ]

  it.each<[CommentSortingOption, string[]]>([
    ['best', ['1', '2', '3']], // Original order
    ['qa', ['1', '2', '3']], // Original order
    ['top', ['2', '1', '3']], // By ups descending: 50, 10, 5
    ['new', ['2', '3', '1']], // By time descending: 3000, 2000, 1000
    ['old', ['1', '3', '2']], // By time ascending: 1000, 2000, 3000
    ['controversial', ['3', '1', '2']] // By ups ascending: 5, 10, 50
  ])('should sort by %s correctly', (sortOption, expectedOrder) => {
    const result = sortComments(comments, sortOption)
    expect(result.map((c) => c.id)).toEqual(expectedOrder)
  })

  it('should return empty array when input is empty', () => {
    const result = sortComments([], 'top')
    expect(result).toEqual([])
  })

  it('should return single comment unchanged', () => {
    const singleComment = [createComment('1', 10, 1000)]
    const result = sortComments(singleComment, 'top')
    expect(result).toEqual(singleComment)
  })

  it('should handle comments with equal scores (top sort)', () => {
    const equalScores = [
      createComment('1', 10, 1000),
      createComment('2', 10, 2000),
      createComment('3', 10, 3000)
    ]
    const result = sortComments(equalScores, 'top')
    // All have same score, order should be stable
    expect(result).toHaveLength(3)
    expect(result.every((c) => c.ups === 10)).toBe(true)
  })

  it('should handle comments with equal times (new sort)', () => {
    const equalTimes = [
      createComment('1', 10, 1000),
      createComment('2', 20, 1000),
      createComment('3', 30, 1000)
    ]
    const result = sortComments(equalTimes, 'new')
    // All have same time, order should be stable
    expect(result).toHaveLength(3)
    expect(result.every((c) => c.created_utc === 1000)).toBe(true)
  })

  it('should handle missing ups field (defaults to 0)', () => {
    const missingUps: AutoCommentData[] = [
      {...createComment('1', 10, 1000)},
      {...createComment('2', 0, 2000), ups: undefined},
      createComment('3', 5, 3000)
    ]
    const result = sortComments(missingUps, 'top')
    expect(result[0].id).toBe('1') // 10 ups
    expect(result[1].id).toBe('3') // 5 ups
    expect(result[2].id).toBe('2') // undefined → 0 ups
  })

  it('should handle missing created_utc field (defaults to 0)', () => {
    const missingTime: AutoCommentData[] = [
      createComment('1', 10, 1000),
      {...createComment('2', 20, 0), created_utc: undefined},
      createComment('3', 30, 3000)
    ]
    const result = sortComments(missingTime, 'new')
    expect(result[0].id).toBe('3') // 3000
    expect(result[1].id).toBe('1') // 1000
    expect(result[2].id).toBe('2') // undefined → 0
  })

  it('should not modify original array', () => {
    const original = [...comments]
    const originalIds = original.map((c) => c.id)

    sortComments(original, 'top')

    // Original array should remain unchanged
    expect(original.map((c) => c.id)).toEqual(originalIds)
  })

  it('should not modify original comment objects', () => {
    const original = [...comments]
    const originalUps = original.map((c) => c.ups)

    sortComments(original, 'top')

    // Original comment objects should remain unchanged
    expect(original.map((c) => c.ups)).toEqual(originalUps)
  })

  it('should return original order for unknown sort option', () => {
    const result = sortComments(
      comments,
      'invalid' as unknown as CommentSortingOption
    )
    expect(result.map((c) => c.id)).toEqual(['1', '2', '3'])
  })

  it('should work with NestedCommentData type', () => {
    const nestedComments = [
      {...createComment('1', 10, 1000), replies: [], depth: 0},
      {...createComment('2', 50, 3000), replies: [], depth: 0},
      {...createComment('3', 5, 2000), replies: [], depth: 0}
    ]

    const result = sortComments(nestedComments, 'top')
    expect(result[0].id).toBe('2') // Highest score
    expect(result).toHaveLength(3)
  })

  it('should handle large comment arrays efficiently', () => {
    // Use deterministic sequence instead of Math.random() for security
    const largeDataset = Array.from({length: 1000}, (_, i) =>
      createComment(`${i}`, (i * 7) % 100, Date.now() + i)
    )

    const start = performance.now()
    const result = sortComments(largeDataset, 'top')
    const duration = performance.now() - start

    expect(result).toHaveLength(1000)
    expect(duration).toBeLessThan(100) // Should complete in < 100ms
  })
})
