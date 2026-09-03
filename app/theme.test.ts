import {describe, expect, it} from 'vitest'
import {theme} from './theme'

describe('theme', () => {
  it('sets the Reddit-branded primary color', () => {
    expect(theme.primaryColor).toBe('redditColorScheme')
  })

  it('uses a WCAG AA compliant primary shade for both color schemes', () => {
    expect(theme.primaryShade).toEqual({light: 8, dark: 8})
  })

  it('defines the Reddit orange color tuple', () => {
    expect(theme.colors?.redditColorScheme).toHaveLength(10)
    expect(theme.colors?.redditColorScheme?.[6]).toBe('#ff4500')
  })

  it('sets default component props for Anchor, Button, and ActionIcon', () => {
    expect(theme.components?.Anchor?.defaultProps).toEqual({underline: 'never'})
    expect(theme.components?.Button?.defaultProps).toEqual({radius: 'xl'})
    expect(theme.components?.ActionIcon?.defaultProps).toEqual({radius: 'xl'})
  })
})
