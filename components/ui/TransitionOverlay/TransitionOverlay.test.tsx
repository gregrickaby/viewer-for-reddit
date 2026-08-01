import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {TransitionOverlay} from './TransitionOverlay'

describe('TransitionOverlay', () => {
  it('renders the label when visible', () => {
    render(<TransitionOverlay visible label="Loading hot posts..." />)

    expect(screen.getByText('Loading hot posts...')).toBeInTheDocument()
  })

  it('renders nothing when not visible', () => {
    render(<TransitionOverlay visible={false} label="Loading hot posts..." />)

    expect(screen.queryByText('Loading hot posts...')).not.toBeInTheDocument()
  })
})
