import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {TimeAgo} from './TimeAgo'

describe('TimeAgo', () => {
  it('renders the relative time after mount', () => {
    const oneHourAgo = Date.now() / 1000 - 3600
    render(<TimeAgo timestamp={oneHourAgo} />)

    expect(screen.getByText(/h ago/)).toBeInTheDocument()
  })

  it('renders seconds for recent timestamps', () => {
    const justNow = Date.now() / 1000 - 30
    render(<TimeAgo timestamp={justNow} />)

    expect(screen.getByText(/s ago/)).toBeInTheDocument()
  })

  it('renders years for old timestamps', () => {
    const oneYearAgo = Date.now() / 1000 - 31536000
    render(<TimeAgo timestamp={oneYearAgo} />)

    expect(screen.getByText(/y ago/)).toBeInTheDocument()
  })

  it('updates when the timestamp prop changes', () => {
    const oneHourAgo = Date.now() / 1000 - 3600
    const {rerender} = render(<TimeAgo timestamp={oneHourAgo} />)

    expect(screen.getByText(/h ago/)).toBeInTheDocument()

    const oneYearAgo = Date.now() / 1000 - 31536000
    rerender(<TimeAgo timestamp={oneYearAgo} />)

    expect(screen.getByText(/y ago/)).toBeInTheDocument()
  })
})
