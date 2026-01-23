import {render, screen} from '@/test-utils'
import type {ReactElement} from 'react'
import {describe, expect, it} from 'vitest'
import {ErrorBoundary} from './ErrorBoundary'

function Boom(): ReactElement {
  throw new Error('Boom')
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <div>Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders fallback when child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByText('Fallback')).toBeInTheDocument()
  })
})
