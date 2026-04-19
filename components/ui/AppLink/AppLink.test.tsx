import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {AppLink} from './AppLink'

describe('AppLink', () => {
  describe('rendering', () => {
    it('renders a link with the given href', () => {
      render(<AppLink href="/">Home</AppLink>)

      const link = screen.getByRole('link', {name: 'Home'})
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders children correctly', () => {
      render(<AppLink href="/about">About</AppLink>)

      expect(screen.getByText('About')).toBeInTheDocument()
    })

    it('forwards additional props to the underlying link', () => {
      render(
        <AppLink href="/test" data-testid="test-link">
          Test
        </AppLink>
      )

      expect(screen.getByTestId('test-link')).toBeInTheDocument()
    })

    it('merges className with internal styles', () => {
      render(
        <AppLink href="/" className="custom-class">
          Link
        </AppLink>
      )

      const link = screen.getByRole('link', {name: 'Link'})
      expect(link).toHaveClass('custom-class')
    })
  })

  describe('accessibility', () => {
    it('is keyboard accessible', () => {
      render(<AppLink href="/">Accessible link</AppLink>)

      const link = screen.getByRole('link', {name: 'Accessible link'})
      expect(link).toBeInTheDocument()
    })
  })
})
