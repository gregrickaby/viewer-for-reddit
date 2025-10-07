import {decodeAndSanitizeHtml, sanitizeText} from './sanitizeText'

describe('sanitizeText', () => {
  it('removes disallowed tags', () => {
    expect(sanitizeText('<script>alert(1)</script><b>bold</b>')).toBe(
      '<b>bold</b>'
    )
  })

  it('allows allowed tags and attributes', () => {
    expect(sanitizeText('<a href="/foo" target="_blank">link</a>')).toBe(
      '<a href="/foo" target="_blank">link</a>'
    )
  })

  it('removes disallowed attributes', () => {
    expect(sanitizeText('<a href="/foo" onclick="evil()">link</a>')).toBe(
      '<a href="/foo">link</a>'
    )
  })

  it('preserves class attributes on all elements', () => {
    expect(
      sanitizeText('<div class="md"><p class="text">content</p></div>')
    ).toBe('<div class="md"><p class="text">content</p></div>')
  })

  it('preserves HTML entities in text content (sanitize-html behavior)', () => {
    expect(sanitizeText('foo &amp; bar')).toBe('foo &amp; bar')
  })

  it('preserves complex HTML structure', () => {
    const input =
      '<div class="md"><p>Text with <strong>bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul></div>'
    expect(sanitizeText(input)).toBe(input)
  })

  it('returns empty string for empty input', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(sanitizeText(undefined as any)).toBe('')
  })

  it('returns empty string for null input', () => {
    expect(sanitizeText(null as any)).toBe('')
  })
})

describe('decodeAndSanitizeHtml', () => {
  it('decodes Reddit-style double-encoded HTML', () => {
    const redditHtml =
      '&lt;div class="md"&gt;&lt;p&gt;Hello world&lt;/p&gt;&lt;/div&gt;'
    const expected = '<div class="md"><p>Hello world</p></div>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('decodes and sanitizes links with proper security attributes', () => {
    const redditHtml =
      '&lt;p&gt;Check out &lt;a href="https://example.com"&gt;this link&lt;/a&gt;&lt;/p&gt;'
    const expected =
      '<p>Check out <a href="https://example.com" target="_blank" rel="noopener noreferrer">this link</a></p>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('adds security attributes to links without href', () => {
    const redditHtml = '&lt;a&gt;broken link&lt;/a&gt;'
    const expected =
      '<a href="#" target="_blank" rel="noopener noreferrer">broken link</a>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('removes dangerous tags even after decoding', () => {
    const redditHtml =
      '&lt;script&gt;alert("xss")&lt;/script&gt;&lt;p&gt;safe content&lt;/p&gt;'
    const expected = '<p>safe content</p>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('preserves existing target and rel attributes on links', () => {
    const redditHtml =
      '&lt;a href="/internal" target="_self" rel="bookmark"&gt;internal&lt;/a&gt;'
    const expected =
      '<a href="/internal" target="_blank" rel="noopener noreferrer">internal</a>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('handles complex Reddit comment HTML structure', () => {
    const redditHtml =
      '&lt;div class="md"&gt;&lt;p&gt;Here&#x27;s a comment with &lt;strong&gt;bold text&lt;/strong&gt; and a &lt;a href="https://reddit.com"&gt;Reddit link&lt;/a&gt;.&lt;/p&gt;\n\n&lt;p&gt;Second paragraph with &lt;em&gt;emphasis&lt;/em&gt;.&lt;/p&gt;&lt;/div&gt;'
    const expected =
      '<div class="md"><p>Here\'s a comment with <strong>bold text</strong> and a <a href="https://reddit.com" target="_blank" rel="noopener noreferrer">Reddit link</a>.</p>\n\n<p>Second paragraph with <em>emphasis</em>.</p></div>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('handles all common HTML entities', () => {
    const redditHtml =
      '&lt;p&gt;Symbols: &amp;amp; &quot;quotes&quot; &#x27;apostrophe&#x27; &#x2F;slash&#x2F; &lt;less&gt; greater&gt;&lt;/p&gt;'
    const expected =
      '<p>Symbols: &amp; "quotes" \'apostrophe\' /slash/  greater&gt;</p>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('preserves unknown entities unchanged', () => {
    const redditHtml = '&lt;p&gt;Unknown: &unknown; &rarr;&lt;/p&gt;'
    const expected = '<p>Unknown: &amp;unknown; →</p>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('handles list structures', () => {
    const redditHtml =
      '&lt;ul&gt;&lt;li&gt;First item&lt;/li&gt;&lt;li&gt;Second item with &lt;code&gt;code&lt;/code&gt;&lt;/li&gt;&lt;/ul&gt;'
    const expected =
      '<ul><li>First item</li><li>Second item with <code>code</code></li></ul>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('handles blockquotes and code blocks', () => {
    const redditHtml =
      '&lt;blockquote&gt;&lt;p&gt;Quoted text&lt;/p&gt;&lt;/blockquote&gt;&lt;pre&gt;&lt;code&gt;code block&lt;/code&gt;&lt;/pre&gt;'
    const expected =
      '<blockquote><p>Quoted text</p></blockquote><pre><code>code block</code></pre>'
    expect(decodeAndSanitizeHtml(redditHtml)).toBe(expected)
  })

  it('returns empty string for empty input', () => {
    expect(decodeAndSanitizeHtml('')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(decodeAndSanitizeHtml(undefined as any)).toBe('')
  })

  it('returns empty string for null input', () => {
    expect(decodeAndSanitizeHtml(null as any)).toBe('')
  })
})
