import { describe, expect, it } from 'vitest'
import { safeNext } from '@/lib/auth/next-param'

describe('safeNext', () => {
  it.each([
    ['/saved', '/saved'],
    ['/r/nextjs?sort=top&t=week', '/r/nextjs?sort=top&t=week'],
    ['/r/pics/comments/abc/slug#c-def', '/r/pics/comments/abc/slug#c-def'],
    ['/user/spez', '/user/spez'],
  ])('keeps same-origin path %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })

  it.each([
    null,
    undefined,
    '',
    'saved',
    'https://evil.com',
    'http://evil.com/home',
    '//evil.com',
    '///evil.com',
    '/\\evil.com',
    '\\\\evil.com',
    '/%2F%2Fevil.com',
    '%2F%2Fevil.com',
    '/%5Cevil.com',
    'javascript:alert(1)',
    '/\tevil.com',
    '/%0a/evil.com',
    '/%E0%A4%A', // malformed escape
  ])('rejects %j', (input) => {
    expect(safeNext(input)).toBe('/home')
  })

  it('uses the provided fallback', () => {
    expect(safeNext('//evil.com', '/saved')).toBe('/saved')
  })
})
