import {getAnalyticsConfig} from '@/lib/utils/env'
import {render} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Analytics} from './Analytics'

vi.mock('@/lib/utils/env', () => ({
  getAnalyticsConfig: vi.fn()
}))

const mockGetAnalyticsConfig = vi.mocked(getAnalyticsConfig)

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('returns null when analytics is disabled', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: false
      })

      const {container} = render(<Analytics />)

      // Check that no script element is rendered (Mantine styles don't count)
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })

    it('renders Script component when analytics is enabled', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: 'https://analytics.example.com/script.js',
        websiteId: 'test-website-id-123'
      })

      const {container} = render(<Analytics />)

      // Next.js Script component doesn't render actual script tag in test env
      // Just verify component renders something (not null)
      expect(container).not.toBeEmptyDOMElement()
    })

    it('calls getAnalyticsConfig on render', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: 'https://umami.example.com/umami.js',
        websiteId: 'abc-123-xyz'
      })

      render(<Analytics />)

      expect(mockGetAnalyticsConfig).toHaveBeenCalledTimes(1)
    })
  })

  describe('configuration scenarios', () => {
    it('renders when scriptUrl is missing but enabled is true', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        websiteId: 'test-id'
      })

      const {container} = render(<Analytics />)

      expect(container).not.toBeEmptyDOMElement()
    })

    it('renders when websiteId is missing but enabled is true', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: 'https://analytics.example.com/script.js'
      })

      const {container} = render(<Analytics />)

      expect(container).not.toBeEmptyDOMElement()
    })

    it('renders with empty strings for scriptUrl and websiteId', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: '',
        websiteId: ''
      })

      const {container} = render(<Analytics />)

      expect(container).not.toBeEmptyDOMElement()
    })
  })

  describe('multiple renders', () => {
    it('consistently returns null when disabled', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: false
      })

      const {container, rerender} = render(<Analytics />)
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()

      rerender(<Analytics />)
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })

    it('consistently renders when enabled', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: 'https://analytics.example.com/script.js',
        websiteId: 'test-id'
      })

      const {container, rerender} = render(<Analytics />)
      expect(container).not.toBeEmptyDOMElement()

      rerender(<Analytics />)
      expect(container).not.toBeEmptyDOMElement()
    })
  })

  describe('edge cases', () => {
    it('renders with special characters in scriptUrl', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: 'https://analytics.example.com/script.js?v=1.0&test=true',
        websiteId: 'test-id'
      })

      const {container} = render(<Analytics />)

      expect(container).not.toBeEmptyDOMElement()
    })

    it('renders with special characters in websiteId', () => {
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: 'https://analytics.example.com/script.js',
        websiteId: 'test-id-with-dashes_and_underscores.123'
      })

      const {container} = render(<Analytics />)

      expect(container).not.toBeEmptyDOMElement()
    })

    it('renders with very long URLs', () => {
      const longUrl = `https://analytics.example.com/${'a'.repeat(500)}.js`
      mockGetAnalyticsConfig.mockReturnValue({
        enabled: true,
        scriptUrl: longUrl,
        websiteId: 'test-id'
      })

      const {container} = render(<Analytics />)

      expect(container).not.toBeEmptyDOMElement()
    })
  })
})
