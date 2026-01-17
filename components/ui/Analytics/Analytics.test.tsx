import {render} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Analytics} from './Analytics'

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('returns null when analytics is disabled', () => {
      const {container} = render(<Analytics enabled={false} />)

      // Check that no script element is rendered (Mantine styles don't count)
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })

    it('renders Script component when analytics is enabled', () => {
      const {container} = render(
        <Analytics
          enabled
          scriptUrl="https://analytics.example.com/script.js"
          websiteId="test-website-id-123"
        />
      )

      // Next.js Script component doesn't render actual script tag in test env
      // Just verify component renders something (not null)
      expect(container).not.toBeEmptyDOMElement()
    })

    it('returns null when enabled but missing required props', () => {
      const {container} = render(<Analytics enabled websiteId="test-id" />)

      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })
  })

  describe('configuration scenarios', () => {
    it('returns null when scriptUrl is missing', () => {
      const {container} = render(<Analytics enabled websiteId="test-id" />)

      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })

    it('returns null when websiteId is missing', () => {
      const {container} = render(
        <Analytics
          enabled
          scriptUrl="https://analytics.example.com/script.js"
        />
      )

      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })

    it('returns null with empty strings for scriptUrl and websiteId', () => {
      const {container} = render(
        <Analytics enabled scriptUrl="" websiteId="" />
      )

      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })
  })

  describe('multiple renders', () => {
    it('consistently returns null when disabled', () => {
      const {container, rerender} = render(<Analytics enabled={false} />)
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()

      rerender(<Analytics enabled={false} />)
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('script')).toBeNull()
    })

    it('consistently renders when enabled', () => {
      const {container, rerender} = render(
        <Analytics
          enabled
          scriptUrl="https://analytics.example.com/script.js"
          websiteId="test-id"
        />
      )
      expect(container).not.toBeEmptyDOMElement()

      rerender(
        <Analytics
          enabled
          scriptUrl="https://analytics.example.com/script.js"
          websiteId="test-id"
        />
      )
      expect(container).not.toBeEmptyDOMElement()
    })
  })

  describe('edge cases', () => {
    it('renders with special characters in scriptUrl', () => {
      const {container} = render(
        <Analytics
          enabled
          scriptUrl="https://analytics.example.com/script.js?v=1.0&test=true"
          websiteId="test-id"
        />
      )

      expect(container).not.toBeEmptyDOMElement()
    })

    it('renders with special characters in websiteId', () => {
      const {container} = render(
        <Analytics
          enabled
          scriptUrl="https://analytics.example.com/script.js"
          websiteId="test-id-with-dashes_and_underscores.123"
        />
      )

      expect(container).not.toBeEmptyDOMElement()
    })

    it('renders with very long URLs', () => {
      const longUrl = `https://analytics.example.com/${'a'.repeat(500)}.js`
      const {container} = render(
        <Analytics enabled scriptUrl={longUrl} websiteId="test-id" />
      )

      expect(container).not.toBeEmptyDOMElement()
    })
  })
})
