import {render, screen} from '@/test-utils'
import type {ReactElement} from 'react'
import {describe, expect, it} from 'vitest'
import {ErrorBoundary} from './ErrorBoundary'

function Boom(): ReactElement {
  throw new Error('Something went wrong')
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
})
