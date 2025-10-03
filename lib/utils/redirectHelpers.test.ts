import {NextResponse} from 'next/server'
import {describe, expect, it} from 'vitest'
import {createUncachedRedirect} from './redirectHelpers'

describe('createUncachedRedirect', () => {
  it('should create redirect response with correct URL', () => {
    const targetUrl = new URL('https://example.com/success')
    const response = createUncachedRedirect(targetUrl)

    expect(response.status).toBe(307) // Temporary redirect
    expect(response.headers.get('location')).toBe('https://example.com/success')
  })

  it('should set Cache-Control header to prevent caching', () => {
    const targetUrl = new URL('https://example.com/auth')
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
  })

  it('should set Pragma header for HTTP/1.0 compatibility', () => {
    const targetUrl = new URL('https://example.com/callback')
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('Pragma')).toBe('no-cache')
  })

  it('should set Expires header to 0', () => {
    const targetUrl = new URL('https://example.com/logout')
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('Expires')).toBe('0')
  })

  it('should handle URLs with query parameters', () => {
    const targetUrl = new URL('https://example.com/error?code=401&message=test')
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('location')).toBe(
      'https://example.com/error?code=401&message=test'
    )
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-cache, no-store, must-revalidate'
    )
  })

  it('should handle URLs with hash fragments', () => {
    const targetUrl = new URL('https://example.com/page#section')
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('location')).toBe(
      'https://example.com/page#section'
    )
  })

  it('should handle relative paths', () => {
    const targetUrl = new URL('/home', 'https://example.com')
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('location')).toBe('https://example.com/home')
  })

  it('should return NextResponse instance', () => {
    const targetUrl = new URL('https://example.com')
    const response = createUncachedRedirect(targetUrl)

    expect(response).toBeInstanceOf(NextResponse)
  })

  it('should set all three cache prevention headers together', () => {
    const targetUrl = new URL('https://example.com/oauth/callback')
    const response = createUncachedRedirect(targetUrl)

    // Verify all three headers are set
    expect(response.headers.has('Cache-Control')).toBe(true)
    expect(response.headers.has('Pragma')).toBe(true)
    expect(response.headers.has('Expires')).toBe(true)
  })

  it('should handle complex URLs with multiple query params', () => {
    const targetUrl = new URL(
      'https://example.com/redirect?error=invalid_state&message=Security+validation+failed&error_id=uuid-123'
    )
    const response = createUncachedRedirect(targetUrl)

    expect(response.headers.get('location')).toContain('error=invalid_state')
    expect(response.headers.get('location')).toContain(
      'message=Security+validation+failed'
    )
    expect(response.headers.get('location')).toContain('error_id=uuid-123')
  })
})
