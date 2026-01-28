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

  it('renders generic error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    // Verify alert structure
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Verify list exists
    const list = document.querySelector('ol')
    expect(list).toBeInTheDocument()
    expect(list?.querySelectorAll('li')).toHaveLength(3)

    // Verify login button (error boundary doesn't pass auth prop)
    expect(
      screen.getByRole('link', {name: /log in with reddit/i})
    ).toBeInTheDocument()
  })
})
