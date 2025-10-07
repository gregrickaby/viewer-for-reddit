import {NotFoundClient} from '@/components/Layout/NotFoundClient/NotFoundClient'
import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'

const mockLogClientError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/utils/logging/clientLogger', () => ({
  logClientError: mockLogClientError
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn(({src, alt, ...props}) => (
    <img src={src} alt={alt} {...props} />
  ))
}))

// Mock window.location and related browser APIs
const mockLocation = {
  pathname: '/test/path',
  search: '?param=value&token=secret123',
  hash: '#section',
  href: 'https://example.com/test/path?param=value&token=secret123#section',
  origin: 'https://example.com',
  host: 'example.com',
  hostname: 'example.com',
  port: '443',
  protocol: 'https:'
}

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Test Browser',
  language: 'en-US',
  languages: ['en-US', 'en', 'es'],
  cookieEnabled: true,
  onLine: true
}

const mockScreen = {
  width: 1920,
  height: 1080
}

const mockWindow = {
  innerWidth: 1280,
  innerHeight: 720
}

const mockDocument = {
  referrer: 'https://google.com',
  title: '404 - Not Found'
}

// Setup browser API mocks
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(window, 'screen', {
  value: mockScreen,
  writable: true
})

Object.defineProperty(window, 'innerWidth', {
  value: mockWindow.innerWidth,
  writable: true
})

Object.defineProperty(window, 'innerHeight', {
  value: mockWindow.innerHeight,
  writable: true
})

Object.defineProperty(document, 'referrer', {
  value: mockDocument.referrer,
  writable: true
})

Object.defineProperty(document, 'title', {
  value: mockDocument.title,
  writable: true
})

describe('NotFoundClient', () => {
  const defaultServerHeaders = {
    referer: 'https://google.com',
    userAgent: 'Test User Agent',
    host: 'example.com',
    xForwardedFor: '192.168.1.1',
    xRealIp: '10.0.0.1',
    acceptLanguage: 'en-US,en;q=0.9',
    accept: 'text/html,application/xhtml+xml',
    connection: 'keep-alive',
    upgradeInsecureRequests: '1',
    secFetchSite: 'none',
    secFetchMode: 'navigate',
    secFetchDest: 'document',
    purpose: null,
    nextUrl: null,
    xMiddlewareNext: null,
    xInvokePath: '/test/path',
    xInvokeRoute: null,
    xMatchedPath: null,
    xRoutePath: null,
    pathname: '/test/path'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Date.now mock to ensure consistent timestamps
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-25T12:00:00Z'))
  })

  it('should render 404 page with correct content', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      '404 - Not Found'
    )
    // Use a function matcher since text is split by <code> element
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === 'The page /test/path cannot be found.'
      })
    ).toBeInTheDocument()
    expect(screen.getByText('/test/path')).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Go to homepage'})).toHaveAttribute(
      'href',
      '/'
    )
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/')
  })

  it('should render images with correct attributes', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    // Find Snoo icon by its alt text
    const snooIcon = screen.getByAltText('Reddit Logo')
    expect(snooIcon).toHaveAttribute('height', '64')
    expect(snooIcon).toHaveAttribute('width', '64')

    // Find Not found animation by its alt text
    const notFoundImage = screen.getByAltText('Not Found')
    expect(notFoundImage).toBeInTheDocument()
  })

  it('should log client error with comprehensive context on mount', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    expect(mockLogClientError).toHaveBeenCalledOnce()
    expect(mockLogClientError).toHaveBeenCalledWith(
      '404 Page Not Found: /test/path',
      expect.objectContaining({
        component: 'NotFoundClient',
        action: '404',
        context: 'Client-side 404 with full route and browser context'
      })
    )
  })

  it('should sanitize URL data in logged context', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    // Check that sensitive token was removed from URL data
    expect(loggedContext.href).toBe(
      'https://example.com/test/path?param=value#section'
    )
    expect(loggedContext.search).toBe('?param=value')
    expect(loggedContext.href).not.toContain('token=secret123')
    expect(loggedContext.search).not.toContain('token=secret123')
  })

  it('should include sanitized location data in logged context', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext).toMatchObject({
      pathname: '/test/path',
      search: '?param=value',
      hash: '#section',
      href: 'https://example.com/test/path?param=value#section',
      origin: 'https://example.com',
      host: 'example.com',
      hostname: 'example.com',
      port: '443',
      protocol: 'https:'
    })
  })

  it('should include browser information in logged context', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext).toMatchObject({
      referrer: 'https://google.com',
      title: '404 - Not Found',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Test Browser',
      language: 'en-US',
      languages: ['en-US', 'en', 'es'],
      cookieEnabled: true,
      onLine: true
    })
  })

  it('should include screen and viewport information in logged context', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext).toMatchObject({
      screenWidth: 1920,
      screenHeight: 1080,
      viewportWidth: 1280,
      viewportHeight: 720
    })
  })

  it('should include timestamp in logged context', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext.timestamp).toBe('2025-09-25T12:00:00.000Z')
  })

  it('should include server headers in logged context', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext.serverHeaders).toEqual(defaultServerHeaders)
  })

  it('should truncate long user agent strings', () => {
    const longUserAgent = 'A'.repeat(300)
    Object.defineProperty(window, 'navigator', {
      value: {...mockNavigator, userAgent: longUserAgent},
      writable: true
    })

    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext.userAgent).toHaveLength(200)
    expect(loggedContext.userAgent).toBe('A'.repeat(200))
  })

  it('should limit languages array to first 3 items', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...mockNavigator,
        languages: ['en-US', 'en', 'es', 'fr', 'de', 'it']
      },
      writable: true
    })

    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext.languages).toEqual(['en-US', 'en', 'es'])
    expect(loggedContext.languages).toHaveLength(3)
  })

  it('should handle empty server headers', () => {
    const emptyHeaders = {
      referer: null,
      userAgent: null,
      host: null,
      xForwardedFor: null,
      xRealIp: null,
      acceptLanguage: null,
      accept: null,
      connection: null,
      upgradeInsecureRequests: null,
      secFetchSite: null,
      secFetchMode: null,
      secFetchDest: null,
      purpose: null,
      nextUrl: null,
      xMiddlewareNext: null,
      xInvokePath: null,
      xInvokeRoute: null,
      xMatchedPath: null,
      xRoutePath: null,
      pathname: null
    }

    render(<NotFoundClient serverHeaders={emptyHeaders} />)

    const loggedContext = mockLogClientError.mock.calls[0][1]

    expect(loggedContext.serverHeaders).toEqual(emptyHeaders)
  })

  it('should re-log when server headers change', () => {
    const {rerender} = render(
      <NotFoundClient serverHeaders={defaultServerHeaders} />
    )

    expect(mockLogClientError).toHaveBeenCalledOnce()

    const newHeaders = {...defaultServerHeaders, pathname: '/different/path'}
    rerender(<NotFoundClient serverHeaders={newHeaders} />)

    expect(mockLogClientError).toHaveBeenCalledTimes(2)
  })

  it('should render valid HTML structure', () => {
    render(<NotFoundClient serverHeaders={defaultServerHeaders} />)

    // Check that the HTML content is structured correctly
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      '404 - Not Found'
    )
    // Use a function matcher since text is split by <code> element
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === 'The page /test/path cannot be found.'
      })
    ).toBeInTheDocument()
    expect(screen.getByText('/test/path')).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)

    // Verify code element exists for pathname
    const codeElement = document.querySelector('code')
    expect(codeElement).toBeInTheDocument()
    expect(codeElement).toHaveTextContent('/test/path')
  })
})
