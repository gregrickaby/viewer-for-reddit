import {renderHook} from '@/test-utils'
import {useUpdateMeta} from './useUpdateMeta'

describe('useUpdateMeta', () => {
  beforeEach(() => {
    // Clear all meta tags before each test
    document.head.innerHTML = ''
    document.title = ''
  })

  it('should update document title', () => {
    renderHook(() => useUpdateMeta('Test Title'))
    expect(document.title).toBe('Test Title')
  })

  it('should update description meta tags', () => {
    renderHook(() => useUpdateMeta(undefined, 'Test description'))

    const descMeta = document.querySelector('meta[name="description"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const twitterDesc = document.querySelector(
      'meta[name="twitter:description"]'
    )

    expect(descMeta?.getAttribute('content')).toBe('Test description')
    expect(ogDesc?.getAttribute('content')).toBe('Test description')
    expect(twitterDesc?.getAttribute('content')).toBe('Test description')
  })

  it('should update Open Graph image', () => {
    renderHook(() =>
      useUpdateMeta(undefined, undefined, 'https://example.com/image.jpg')
    )

    const ogImage = document.querySelector('meta[property="og:image"]')
    const twitterImage = document.querySelector('meta[name="twitter:image"]')

    expect(ogImage?.getAttribute('content')).toBe(
      'https://example.com/image.jpg'
    )
    expect(twitterImage?.getAttribute('content')).toBe(
      'https://example.com/image.jpg'
    )
  })

  it('should update all meta tags when all params provided', () => {
    renderHook(() =>
      useUpdateMeta(
        'Full Title',
        'Full description',
        'https://example.com/full.jpg'
      )
    )

    expect(document.title).toBe('Full Title')

    const ogTitle = document.querySelector('meta[property="og:title"]')
    const ogDesc = document.querySelector('meta[property="og:description"]')
    const ogImage = document.querySelector('meta[property="og:image"]')

    expect(ogTitle?.getAttribute('content')).toBe('Full Title')
    expect(ogDesc?.getAttribute('content')).toBe('Full description')
    expect(ogImage?.getAttribute('content')).toBe(
      'https://example.com/full.jpg'
    )
  })

  it('should update og:url even when no other params provided', () => {
    renderHook(() => useUpdateMeta())

    expect(document.title).toBe('')
    // og:url should still be set to current location
    const ogUrl = document.querySelector('meta[property="og:url"]')
    expect(ogUrl?.getAttribute('content')).toBe('http://localhost:3000')

    // Other meta tags should not be created
    const otherMetaTags = document.querySelectorAll(
      'meta[property^="og:"]:not([property="og:url"]), meta[name^="twitter:"], meta[name="description"]'
    )
    expect(otherMetaTags.length).toBe(0)
  })

  it('should update existing meta tags instead of creating duplicates', () => {
    // Create initial meta tag
    const initialMeta = document.createElement('meta')
    initialMeta.setAttribute('property', 'og:title')
    initialMeta.setAttribute('content', 'Initial Title')
    document.head.appendChild(initialMeta)

    renderHook(() => useUpdateMeta('Updated Title'))

    const metaTags = document.querySelectorAll('meta[property="og:title"]')
    expect(metaTags.length).toBe(1)
    expect(metaTags[0]).toHaveAttribute('content', 'Updated Title')
  })

  it('should handle updates when values change', () => {
    let title = 'First Title'
    const {rerender} = renderHook(() => useUpdateMeta(title))

    expect(document.title).toBe('First Title')

    title = 'Second Title'
    rerender()
    expect(document.title).toBe('Second Title')
  })
})
