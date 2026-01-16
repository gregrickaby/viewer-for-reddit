import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {Logo} from './Logo'

describe('Logo', () => {
  describe('rendering', () => {
    it('renders logo with image and text', () => {
      render(<Logo />)

      const image = screen.getByAltText('Reddit Viewer Logo')
      expect(image).toBeInTheDocument()

      const text = screen.getByText('Reddit Viewer')
      expect(text).toBeInTheDocument()
    })

    it('renders link to home page', () => {
      render(<Logo />)

      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders image with correct dimensions', () => {
      render(<Logo />)

      const image = screen.getByAltText('Reddit Viewer Logo')
      expect(image).toHaveAttribute('width', '32')
      expect(image).toHaveAttribute('height', '32')
    })
  })

  describe('accessibility', () => {
    it('has accessible image alt text', () => {
      render(<Logo />)

      const image = screen.getByAltText('Reddit Viewer Logo')
      expect(image).toBeInTheDocument()
    })

    it('link is keyboard accessible', () => {
      render(<Logo />)

      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
    })
  })

  describe('multiple renders', () => {
    it('renders consistently across multiple renders', () => {
      const {rerender} = render(<Logo />)

      expect(screen.getByText('Reddit Viewer')).toBeInTheDocument()
      expect(screen.getByAltText('Reddit Viewer Logo')).toBeInTheDocument()

      rerender(<Logo />)

      expect(screen.getByText('Reddit Viewer')).toBeInTheDocument()
      expect(screen.getByAltText('Reddit Viewer Logo')).toBeInTheDocument()
    })
  })
})
