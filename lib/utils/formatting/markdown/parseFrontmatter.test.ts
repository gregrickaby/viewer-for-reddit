import {describe, expect, it} from 'vitest'
import {parseFrontmatter} from './parseFrontmatter'

describe('parseFrontmatter', () => {
  it('should parse frontmatter with YAML data', () => {
    const input = `---
title: Test Page
author: Test Author
---
# Content

This is the content.`

    const result = parseFrontmatter(input)

    expect(result.data).toEqual({
      title: 'Test Page',
      author: 'Test Author'
    })
    expect(result.content).toBe('# Content\n\nThis is the content.')
  })

  it('should handle content without frontmatter', () => {
    const input = '# Just Content\n\nNo frontmatter here.'

    const result = parseFrontmatter(input)

    expect(result.data).toEqual({})
    expect(result.content).toBe(input)
  })

  it('should handle empty frontmatter', () => {
    const input = `---

---
# Content only`

    const result = parseFrontmatter(input)

    expect(result.data).toEqual({})
    expect(result.content).toBe('# Content only')
  })

  it('should handle CRLF line endings', () => {
    const input = `---\r
title: Test\r
---\r
Content`

    const result = parseFrontmatter(input)

    expect(result.data).toEqual({title: 'Test'})
    expect(result.content).toBe('Content')
  })

  it('should handle complex YAML structures', () => {
    const input = `---
title: Complex Test
tags:
  - tag1
  - tag2
metadata:
  date: 2024-01-01
  published: true
---
# Content`

    const result = parseFrontmatter(input)

    expect(result.data).toEqual({
      title: 'Complex Test',
      tags: ['tag1', 'tag2'],
      metadata: {
        date: '2024-01-01',
        published: true
      }
    })
    expect(result.content).toBe('# Content')
  })
})
