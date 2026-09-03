import {render, screen} from '@/test-utils'
import {axe} from 'jest-axe'
import {describe, expect, it} from 'vitest'
import {BackToSubreddit} from './BackToSubreddit'

describe('BackToSubreddit', () => {
  it('links back to the subreddit', () => {
    render(<BackToSubreddit subreddit="reactjs" />)

    expect(
      screen.getByRole('link', {name: /back to r\/reactjs/i})
    ).toHaveAttribute('href', '/r/reactjs')
  })

  it('shows the subreddit name in the visible text', () => {
    render(<BackToSubreddit subreddit="typescript" />)

    expect(screen.getByText('Back to r/typescript')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const {container} = render(<BackToSubreddit subreddit="reactjs" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
