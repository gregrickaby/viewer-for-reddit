import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {FeedContainer} from './FeedContainer'

describe('FeedContainer', () => {
  it('renders children content', () => {
    render(
      <FeedContainer>
        <div>Test Content</div>
      </FeedContainer>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
