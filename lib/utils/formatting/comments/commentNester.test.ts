import type {AutoCommentData} from '@/lib/store/services/commentsApi'
import {describe, expect, it} from 'vitest'
import type {NestedCommentData} from './commentFilters'
import {
  extractNestedComments,
  flattenComments,
  MAX_COMMENT_DEPTH
} from './commentNester'

/**
 * Tests for commentNester utility.
 *
 * Covers:
 * - Nesting algorithm with depth tracking
 * - Depth limits and max depth handling
 * - Invalid/malformed data handling
 * - Flattening nested structures
 */

/**
 * Helper to count maximum depth in nested comments.
 */
function getMaxDepth(comments: NestedCommentData[]): number {
  let maxDepth = 0
  const countDepth = (items: NestedCommentData[]) => {
    for (const comment of items) {
      if (comment.depth !== undefined && comment.depth > maxDepth) {
        maxDepth = comment.depth
      }
      if (comment.replies) {
        countDepth(comment.replies)
      }
    }
  }
  countDepth(comments)
  return maxDepth
}

describe('commentNester', () => {
  /**
   * Helper to create mock comment data.
   */
  const createComment = (
    id: string,
    author: string = 'test_user',
    body: string = 'Test comment'
  ): AutoCommentData =>
    ({
      id,
      author,
      body,
      name: `t1_${id}`,
      created_utc: Date.now()
    }) as AutoCommentData

  /**
   * Helper to create Reddit API child structure.
   */
  const createChild = (data: AutoCommentData) => ({data}) as any

  describe('extractNestedComments', () => {
    it('should extract flat comments with depth 0', () => {
      const children = [
        createChild(createComment('1')),
        createChild(createComment('2')),
        createChild(createComment('3'))
      ]

      const result = extractNestedComments(children)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('1')
      expect(result[0].depth).toBe(0)
      expect(result[0].replies).toBeUndefined()
    })

    it('should extract nested comments with correct depths', () => {
      const children = [
        createChild({
          ...createComment('parent'),
          replies: {
            data: {
              children: [
                createChild(createComment('child1')),
                createChild(createComment('child2'))
              ]
            }
          }
        })
      ]

      const result = extractNestedComments(children)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('parent')
      expect(result[0].depth).toBe(0)
      expect(result[0].replies).toHaveLength(2)
      expect(result[0].replies?.[0].depth).toBe(1)
      expect(result[0].replies?.[1].depth).toBe(1)
    })

    it('should handle deeply nested comments', () => {
      const children = [
        createChild({
          ...createComment('level0'),
          replies: {
            data: {
              children: [
                createChild({
                  ...createComment('level1'),
                  replies: {
                    data: {
                      children: [
                        createChild({
                          ...createComment('level2'),
                          replies: {
                            data: {
                              children: [createChild(createComment('level3'))]
                            }
                          }
                        })
                      ]
                    }
                  }
                })
              ]
            }
          }
        })
      ]

      const result = extractNestedComments(children)

      expect(result[0].depth).toBe(0)
      expect(result[0].replies?.[0].depth).toBe(1)
      expect(result[0].replies?.[0].replies?.[0].depth).toBe(2)
      expect(result[0].replies?.[0].replies?.[0].replies?.[0].depth).toBe(3)
    })

    it('should respect MAX_COMMENT_DEPTH limit', () => {
      // Create deeply nested structure exceeding MAX_COMMENT_DEPTH
      let currentChild: any = createChild(createComment('bottom'))

      // Build from bottom up to exceed MAX_COMMENT_DEPTH
      for (let i = MAX_COMMENT_DEPTH; i >= 0; i--) {
        currentChild = createChild({
          ...createComment(`level${i}`),
          replies: {data: {children: [currentChild]}}
        })
      }

      const result = extractNestedComments([currentChild])
      const maxDepth = getMaxDepth(result)

      expect(maxDepth).toBeLessThan(MAX_COMMENT_DEPTH)
    })

    it('should return empty array when depth equals MAX_COMMENT_DEPTH', () => {
      const children = [createChild(createComment('test'))]
      const result = extractNestedComments(children, MAX_COMMENT_DEPTH)
      expect(result).toEqual([])
    })

    it('should return empty array for null children', () => {
      const result = extractNestedComments(null as any)
      expect(result).toEqual([])
    })

    it('should return empty array for undefined children', () => {
      const result = extractNestedComments(undefined as any)
      expect(result).toEqual([])
    })

    it('should return empty array for non-array children', () => {
      const result = extractNestedComments({} as any)
      expect(result).toEqual([])
    })

    it('should skip children with missing data', () => {
      const children = [
        createChild(createComment('1')),
        {data: null},
        createChild(createComment('2'))
      ]

      const result = extractNestedComments(children)
      expect(result).toHaveLength(2)
      expect(result.map((c) => c.id)).toEqual(['1', '2'])
    })

    it('should skip children with invalid data type', () => {
      const children = [
        createChild(createComment('1')),
        {data: 'invalid'},
        createChild(createComment('2'))
      ]

      const result = extractNestedComments(children as any)
      expect(result).toHaveLength(2)
    })

    it('should filter out deleted comments', () => {
      const children = [
        createChild(createComment('1')),
        createChild(createComment('2', 'test_user', '[deleted]')),
        createChild(createComment('3'))
      ]

      const result = extractNestedComments(children)
      expect(result).toHaveLength(2)
      expect(result.map((c) => c.id)).toEqual(['1', '3'])
    })

    it('should filter out removed comments', () => {
      const children = [
        createChild(createComment('1')),
        createChild(createComment('2', 'test_user', '[removed]')),
        createChild(createComment('3'))
      ]

      const result = extractNestedComments(children)
      expect(result).toHaveLength(2)
      expect(result.map((c) => c.id)).toEqual(['1', '3'])
    })

    it('should filter out AutoModerator comments', () => {
      const children = [
        createChild(createComment('1')),
        createChild(createComment('2', 'AutoModerator')),
        createChild(createComment('3'))
      ]

      const result = extractNestedComments(children)
      expect(result).toHaveLength(2)
      expect(result.map((c) => c.id)).toEqual(['1', '3'])
    })

    it('should filter out comments with empty body', () => {
      const children = [
        createChild(createComment('1')),
        createChild(createComment('2', 'test_user', '')),
        createChild(createComment('3'))
      ]

      const result = extractNestedComments(children)
      expect(result).toHaveLength(2)
    })

    it('should handle comments with no replies object', () => {
      const children = [createChild(createComment('1'))]
      const result = extractNestedComments(children)

      expect(result[0].replies).toBeUndefined()
    })

    it('should handle comments with empty replies', () => {
      const children = [
        createChild({
          ...createComment('parent'),
          replies: {data: {children: []}}
        })
      ]

      const result = extractNestedComments(children)
      expect(result[0].replies).toBeUndefined()
    })

    it('should handle malformed replies structure', () => {
      const children = [
        createChild({
          ...createComment('parent'),
          replies: 'invalid' as any
        })
      ]

      const result = extractNestedComments(children as any)
      expect(result[0].replies).toBeUndefined()
    })
  })

  describe('flattenComments', () => {
    const createNestedComment = (
      id: string,
      depth: number,
      replies?: NestedCommentData[]
    ): NestedCommentData => ({
      ...createComment(id),
      depth,
      replies
    })

    it('should flatten single-level comments', () => {
      const nested = [
        createNestedComment('1', 0),
        createNestedComment('2', 0),
        createNestedComment('3', 0)
      ]

      const result = flattenComments(nested)
      expect(result).toHaveLength(3)
      expect(result.map((c) => c.id)).toEqual(['1', '2', '3'])
    })

    it('should flatten nested comments in correct order', () => {
      const nested = [
        createNestedComment('parent', 0, [
          createNestedComment('child1', 1),
          createNestedComment('child2', 1)
        ])
      ]

      const result = flattenComments(nested)
      expect(result).toHaveLength(3)
      expect(result.map((c) => c.id)).toEqual(['parent', 'child1', 'child2'])
    })

    it('should preserve depth information', () => {
      const nested = [
        createNestedComment('parent', 0, [
          createNestedComment('child', 1, [
            createNestedComment('grandchild', 2)
          ])
        ])
      ]

      const result = flattenComments(nested)
      expect(result[0].depth).toBe(0)
      expect(result[1].depth).toBe(1)
      expect(result[2].depth).toBe(2)
    })

    it('should respect custom maxDepth parameter', () => {
      const nested = [
        createNestedComment('level0', 0, [
          createNestedComment('level1', 1, [
            createNestedComment('level2', 2, [createNestedComment('level3', 3)])
          ])
        ])
      ]

      const result = flattenComments(nested, 2)

      // Should include comments at depth 0, 1, 2 but stop before processing depth 3
      expect(result).toHaveLength(3)
      expect(result.map((c) => c.id)).toEqual(['level0', 'level1', 'level2'])
    })

    it('should use MAX_COMMENT_DEPTH by default', () => {
      const nested = [createNestedComment('test', 0)]
      const result = flattenComments(nested)
      expect(result).toBeDefined()
    })

    it('should handle empty array', () => {
      const result = flattenComments([])
      expect(result).toEqual([])
    })

    it('should handle comments without replies', () => {
      const nested = [createNestedComment('test', 0)]
      const result = flattenComments(nested)
      expect(result).toHaveLength(1)
    })

    it('should handle undefined depth values', () => {
      const nested: NestedCommentData[] = [
        {...createComment('test'), depth: undefined} as any
      ]
      const result = flattenComments(nested)
      expect(result).toHaveLength(1)
    })
  })
})
