import {generatePostSlug} from './generatePostSlug'

describe('generatePostSlug', () => {
  it('should convert title to lowercase with underscores', () => {
    expect(generatePostSlug('Padres Dugout Reaction to Umpires')).toBe(
      'padres_dugout_reaction_to_umpires'
    )
  })

  it('should handle special characters and apostrophes', () => {
    expect(generatePostSlug("Padres' Dugout Reaction to Umpires!")).toBe(
      'padres_dugout_reaction_to_umpires'
    )
  })

  it('should replace hyphens with underscores', () => {
    expect(generatePostSlug('Next.js-is-awesome')).toBe('nextjs_is_awesome')
  })

  it('should collapse multiple spaces/underscores', () => {
    expect(generatePostSlug('Multiple    Spaces   Between')).toBe(
      'multiple_spaces_between'
    )
  })

  it('should remove leading and trailing underscores', () => {
    expect(generatePostSlug('  Leading and Trailing  ')).toBe(
      'leading_and_trailing'
    )
  })

  it('should handle empty string', () => {
    expect(generatePostSlug('')).toBe('')
  })

  it('should handle undefined', () => {
    expect(generatePostSlug(undefined)).toBe('')
  })

  it('should truncate very long titles', () => {
    const longTitle =
      'This is a very long title that needs to be truncated because it exceeds the maximum allowed length for URL slugs'
    const result = generatePostSlug(longTitle)

    expect(result.length).toBeLessThanOrEqual(70)
    expect(result).toBe(
      'this_is_a_very_long_title_that_needs_to_be_truncated_because_it_exceed'
    )
  })

  it('should remove trailing underscore after truncation', () => {
    const title = 'A title with_exactly_seventy_one_characters_in_total_here_'
    const result = generatePostSlug(title)

    expect(result).not.toMatch(/_$/)
  })

  it('should handle numbers', () => {
    expect(generatePostSlug('Top 10 Programming Tips for 2024')).toBe(
      'top_10_programming_tips_for_2024'
    )
  })

  it('should handle unicode characters', () => {
    expect(generatePostSlug('Café résumé naïve')).toBe('caf_rsum_nave')
  })

  it('should handle only special characters', () => {
    expect(generatePostSlug('!@#$%^&*()')).toBe('')
  })
})
