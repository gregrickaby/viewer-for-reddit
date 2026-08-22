import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {DirectionalTransition} from './DirectionalTransition'

describe('DirectionalTransition', () => {
  it('renders its children', () => {
    render(
      <DirectionalTransition>
        <p>Page content</p>
      </DirectionalTransition>
    )

    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
