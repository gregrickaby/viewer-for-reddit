import {
  COMMENT_CONTENT_MARKERS,
  extractAndFilterComments,
  filterValidComments,
  isAutoModeratorComment,
  isValidComment
} from './commentFilters'

const mockValidComment = {
  author: 'user123',
  body: 'This is a valid comment',
  body_html: '<p>This is a valid comment</p>'
} as any

const mockDeletedComment = {
  author: COMMENT_CONTENT_MARKERS.DELETED,
  body: COMMENT_CONTENT_MARKERS.DELETED,
  body_html: ''
} as any

const mockRemovedComment = {
  author: COMMENT_CONTENT_MARKERS.REMOVED,
  body: COMMENT_CONTENT_MARKERS.REMOVED,
  body_html: ''
} as any

const mockAutoModComment = {
  author: COMMENT_CONTENT_MARKERS.AUTO_MODERATOR,
  body: 'This is an AutoModerator comment',
  body_html: '<p>This is an AutoModerator comment</p>'
} as any

const mockEmptyComment = {
  author: 'user123',
  body: '',
  body_html: ''
} as any

describe('commentFilters', () => {
  describe('isAutoModeratorComment', () => {
    it('should return true for AutoModerator comments', () => {
      expect(isAutoModeratorComment(mockAutoModComment)).toBe(true)
    })

    it('should return false for regular user comments', () => {
      expect(isAutoModeratorComment(mockValidComment)).toBe(false)
    })
  })

  describe('isValidComment', () => {
    it('should return true for valid comments', () => {
      expect(isValidComment(mockValidComment)).toBe(true)
    })

    it('should return false for deleted comments', () => {
      expect(isValidComment(mockDeletedComment)).toBe(false)
    })

    it('should return false for removed comments', () => {
      expect(isValidComment(mockRemovedComment)).toBe(false)
    })

    it('should return false for empty comments', () => {
      expect(isValidComment(mockEmptyComment)).toBe(false)
    })

    it('should return true for comments with only HTML body', () => {
      const htmlOnlyComment = {
        author: 'user123',
        body: '',
        body_html: '<p>Valid HTML content</p>'
      } as any
      expect(isValidComment(htmlOnlyComment)).toBe(true)
    })
  })

  describe('filterValidComments', () => {
    it('should filter out AutoModerator and invalid comments', () => {
      const comments = [
        mockValidComment,
        mockAutoModComment,
        mockDeletedComment,
        mockRemovedComment,
        mockEmptyComment
      ]

      const filtered = filterValidComments(comments)
      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe(mockValidComment)
    })

    it('should return empty array for all invalid comments', () => {
      const comments = [
        mockAutoModComment,
        mockDeletedComment,
        mockRemovedComment
      ]
      const filtered = filterValidComments(comments)
      expect(filtered).toHaveLength(0)
    })

    it('should preserve all valid comments', () => {
      const validComment2 = {
        author: 'user456',
        body: 'Another valid comment',
        body_html: '<p>Another valid comment</p>'
      } as any

      const comments = [mockValidComment, validComment2]
      const filtered = filterValidComments(comments)
      expect(filtered).toHaveLength(2)
      expect(filtered).toEqual([mockValidComment, validComment2])
    })
  })

  describe('extractAndFilterComments', () => {
    it('should extract and filter comment data from children array', () => {
      const children = [
        {data: mockValidComment},
        {data: mockAutoModComment},
        {data: mockDeletedComment},
        {data: null}, // Should be filtered out
        {data: undefined} // Should be filtered out
      ]

      const result = extractAndFilterComments(children)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockValidComment)
    })

    it('should handle empty children array', () => {
      const result = extractAndFilterComments([])
      expect(result).toHaveLength(0)
    })

    it('should handle children with no data property', () => {
      const children = [{}, {data: mockValidComment}]
      const result = extractAndFilterComments(children)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(mockValidComment)
    })
  })
})
