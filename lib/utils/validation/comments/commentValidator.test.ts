import {describe, expect, it} from 'vitest'
import {
  isValidCommentLength,
  MAX_COMMENT_LENGTH,
  MIN_COMMENT_LENGTH,
  sanitizeCommentInput,
  validateCommentText
} from './commentValidator'

describe('commentValidator', () => {
  describe('validateCommentText', () => {
    it('should validate a normal comment', () => {
      const result = validateCommentText('This is a valid comment')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject non-string input', () => {
      const result = validateCommentText(123)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Comment must be a string')
    })

    it('should reject null', () => {
      const result = validateCommentText(null)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Comment must be a string')
    })

    it('should reject undefined', () => {
      const result = validateCommentText(undefined)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Comment must be a string')
    })

    it('should reject empty string', () => {
      const result = validateCommentText('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Comment cannot be empty')
    })

    it('should reject whitespace-only string', () => {
      const result = validateCommentText('   \t\n  ')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Comment cannot be empty')
    })

    it('should reject comment exceeding max length', () => {
      const longComment = 'a'.repeat(MAX_COMMENT_LENGTH + 1)
      const result = validateCommentText(longComment)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe(
        `Comment exceeds maximum length of ${MAX_COMMENT_LENGTH} characters`
      )
    })

    it('should accept comment at max length', () => {
      const maxComment = 'a'.repeat(MAX_COMMENT_LENGTH)
      const result = validateCommentText(maxComment)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept comment at min length', () => {
      const minComment = 'a'.repeat(MIN_COMMENT_LENGTH)
      const result = validateCommentText(minComment)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept markdown content', () => {
      const markdown = '# Header\n\n**bold** and *italic*\n\n- list item'
      const result = validateCommentText(markdown)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept unicode characters', () => {
      const unicode = '你好世界 🚀 Émoji'
      const result = validateCommentText(unicode)
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('sanitizeCommentInput', () => {
    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeCommentInput(input)
      expect(result).toBe('Hello World')
    })

    it('should normalize Windows line endings', () => {
      const input = 'Line 1\r\nLine 2\r\nLine 3'
      const result = sanitizeCommentInput(input)
      expect(result).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should strip null bytes', () => {
      const input = 'Hello\0World'
      const result = sanitizeCommentInput(input)
      expect(result).toBe('HelloWorld')
    })

    it('should limit consecutive newlines to 2', () => {
      const input = 'Paragraph 1\n\n\n\n\nParagraph 2'
      const result = sanitizeCommentInput(input)
      expect(result).toBe('Paragraph 1\n\nParagraph 2')
    })

    it('should preserve 2 consecutive newlines', () => {
      const input = 'Paragraph 1\n\nParagraph 2'
      const result = sanitizeCommentInput(input)
      expect(result).toBe('Paragraph 1\n\nParagraph 2')
    })

    it('should preserve single newlines', () => {
      const input = 'Line 1\nLine 2\nLine 3'
      const result = sanitizeCommentInput(input)
      expect(result).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should handle empty string', () => {
      const result = sanitizeCommentInput('')
      expect(result).toBe('')
    })

    it('should handle string with only whitespace', () => {
      const result = sanitizeCommentInput('   \t\n  ')
      expect(result).toBe('')
    })

    it('should apply all sanitization rules together', () => {
      const input = '  Line 1\r\n\r\n\r\n\r\nLine 2\0  '
      const result = sanitizeCommentInput(input)
      expect(result).toBe('Line 1\n\nLine 2')
    })

    it('should preserve markdown formatting', () => {
      const markdown = '# Header\n\n**bold** *italic*\n\n- item'
      const result = sanitizeCommentInput(markdown)
      expect(result).toBe(markdown)
    })

    it('should preserve code blocks with multiple newlines', () => {
      const code = 'Text\n\n```\ncode\n```\n\nMore text'
      const result = sanitizeCommentInput(code)
      expect(result).toBe(code)
    })

    it('should handle unicode safely', () => {
      const unicode = '你好世界 🚀'
      const result = sanitizeCommentInput(unicode)
      expect(result).toBe(unicode)
    })
  })

  describe('isValidCommentLength', () => {
    it('should return true for normal comment', () => {
      expect(isValidCommentLength('Hello world')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isValidCommentLength('')).toBe(false)
    })

    it('should return false for whitespace-only string', () => {
      expect(isValidCommentLength('   \t\n  ')).toBe(false)
    })

    it('should return true at max length', () => {
      const maxComment = 'a'.repeat(MAX_COMMENT_LENGTH)
      expect(isValidCommentLength(maxComment)).toBe(true)
    })

    it('should return false over max length', () => {
      const tooLong = 'a'.repeat(MAX_COMMENT_LENGTH + 1)
      expect(isValidCommentLength(tooLong)).toBe(false)
    })

    it('should return true at min length', () => {
      const minComment = 'a'.repeat(MIN_COMMENT_LENGTH)
      expect(isValidCommentLength(minComment)).toBe(true)
    })

    it('should trim before checking length', () => {
      const comment = '  a  '
      expect(isValidCommentLength(comment)).toBe(true)
    })
  })

  describe('Constants', () => {
    it('should have correct MAX_COMMENT_LENGTH', () => {
      expect(MAX_COMMENT_LENGTH).toBe(10000)
    })

    it('should have correct MIN_COMMENT_LENGTH', () => {
      expect(MIN_COMMENT_LENGTH).toBe(1)
    })
  })
})
