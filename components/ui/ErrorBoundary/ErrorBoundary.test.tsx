import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorBoundary} from './ErrorBoundary'

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
