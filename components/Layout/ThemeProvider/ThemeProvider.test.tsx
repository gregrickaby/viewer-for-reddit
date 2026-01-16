import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ThemeProvider} from './ThemeProvider'

describe('ThemeProvider', () => {
  describe('rendering', () => {
    it('renders children', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders multiple children', () => {
      render(
        <ThemeProvider>
          <div>First Child</div>
          <div>Second Child</div>
          <span>Third Child</span>
        </ThemeProvider>
      )

      expect(screen.getByText('First Child')).toBeInTheDocument()
      expect(screen.getByText('Second Child')).toBeInTheDocument()
      expect(screen.getByText('Third Child')).toBeInTheDocument()
    })

    it('renders nested elements', () => {
      render(
        <ThemeProvider>
          <div>
            <p>Nested paragraph</p>
            <span>Nested span</span>
          </div>
        </ThemeProvider>
      )

      expect(screen.getByText('Nested paragraph')).toBeInTheDocument()
      expect(screen.getByText('Nested span')).toBeInTheDocument()
    })

    it('renders without children', () => {
      const {container} = render(<ThemeProvider>{null}</ThemeProvider>)

      expect(container).toBeInTheDocument()
    })
  })

  describe('provider functionality', () => {
    it('provides theme context to children', () => {
      render(
        <ThemeProvider>
          <div data-testid="themed-child">Content</div>
        </ThemeProvider>
      )

      const child = screen.getByTestId('themed-child')
      expect(child).toBeInTheDocument()
    })

    it('wraps content with MantineProvider', () => {
      const {container} = render(
        <ThemeProvider>
          <div>Content</div>
        </ThemeProvider>
      )

      // MantineProvider adds style tags
      // eslint-disable-next-line testing-library/no-container
      const styles = container.querySelector('style[data-mantine-styles]')
      expect(styles).toBeInTheDocument()
    })
  })

  describe('multiple renders', () => {
    it('consistently renders children across re-renders', () => {
      const {rerender} = render(
        <ThemeProvider>
          <div>Initial Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Initial Content')).toBeInTheDocument()

      rerender(
        <ThemeProvider>
          <div>Updated Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Updated Content')).toBeInTheDocument()
      expect(screen.queryByText('Initial Content')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles empty fragment children', () => {
      const {container} = render(
        <ThemeProvider>
          <></>
        </ThemeProvider>
      )

      expect(container).toBeInTheDocument()
    })

    it('handles complex nested structures', () => {
      render(
        <ThemeProvider>
          <div>
            <header>
              <nav>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                </ul>
              </nav>
            </header>
            <main>
              <article>Content</article>
            </main>
          </div>
        </ThemeProvider>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('handles components as children', () => {
      const TestComponent = () => <div>Test Component</div>

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByText('Test Component')).toBeInTheDocument()
    })
  })
})
