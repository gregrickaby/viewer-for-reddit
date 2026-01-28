import {render, screen} from '@/test-utils'
import type {ReactElement} from 'react'
import {describe, expect, it} from 'vitest'
import {ErrorBoundary} from './ErrorBoundary'

function Boom(): ReactElement {
  throw new Error('Something went wrong')
}

function RateLimitBoom(): ReactElement {
  throw new Error('Rate limit exceeded')
}

function NotFoundBoom(): ReactElement {
  throw new Error('Not found')
}

function ForbiddenBoom(): ReactElement {
  throw new Error('Forbidden')
}

function AuthExpiredBoom(): ReactElement {
  throw new Error('Authentication expired')
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders default ErrorDisplay when child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getAllByText('Something went wrong')).toHaveLength(2)
  })

  it('renders ErrorDisplay with custom title and message', () => {
    render(
      <ErrorBoundary title="Custom Title" message="Custom message">
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  it('uses error message when no custom message provided', () => {
    render(
      <ErrorBoundary title="Custom Title">
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
  })

  describe('error message transformations', () => {
    it('transforms rate limit errors to user-friendly message', () => {
      render(
        <ErrorBoundary>
          <RateLimitBoom />
        </ErrorBoundary>
      )

      expect(
        screen.getByText(/You have reached Reddit's rate limit/)
      ).toBeInTheDocument()
      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('transforms 404 errors to user-friendly message', () => {
      render(
        <ErrorBoundary>
          <NotFoundBoom />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('The requested content could not be found.')
      ).toBeInTheDocument()
    })

    it('transforms 403 errors to user-friendly message', () => {
      render(
        <ErrorBoundary>
          <ForbiddenBoom />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('Access to this content is restricted.')
      ).toBeInTheDocument()
    })

    it('transforms authentication errors to user-friendly message', () => {
      render(
        <ErrorBoundary>
          <AuthExpiredBoom />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('Your session has expired. Please log in again.')
      ).toBeInTheDocument()
      expect(screen.getByText('Log in with Reddit')).toBeInTheDocument()
    })

    it('preserves custom message over automatic transformation', () => {
      render(
        <ErrorBoundary message="This is a custom override message">
          <RateLimitBoom />
        </ErrorBoundary>
      )

      expect(
        screen.getByText('This is a custom override message')
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/You have reached Reddit's rate limit/)
      ).not.toBeInTheDocument()
    })
  })

  it('passes digest to ErrorDisplay', () => {
    function DigestBoom(): ReactElement {
      const error = new Error('Test error') as Error & {digest?: string}
      error.digest = 'test123'
      throw error
    }

    render(
      <ErrorBoundary>
        <DigestBoom />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
    expect(screen.getByText('test123')).toBeInTheDocument()
  })
})
