import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {ErrorDisplay} from './ErrorDisplay'

describe('ErrorDisplay', () => {
  it('renders default content', () => {
    render(<ErrorDisplay />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText('Please try again in a moment.')
    ).toBeInTheDocument()
  })

  it('renders custom title and message', () => {
    render(<ErrorDisplay title="Custom title" message="Custom message" />)

    expect(screen.getByText('Custom title')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })
})
