import {render, screen, waitFor} from '@/test-utils'
// userEvent not required for these tests
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {Comments} from './Comments'

describe('Comments', () => {
  it('renders comments from MSW and decodes HTML entities', async () => {
    render(
      <Comments
        permalink="/r/test/comments/1"
        postLink="/r/test/comments/1"
        open
      />
    )

    // wait for the mocked comment author to appear
    await screen.findByText('testuser')

    // Verify the HTML was decoded and rendered properly
    const firstComment = screen.getByText('First comment')
    expect(firstComment).toBeInTheDocument()

    // Verify links are properly decoded and rendered
    const link = screen.getByRole('link', {name: 'link'})
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('shows no comments when none returned', async () => {
    server.use(
      http.get('https://oauth.reddit.com/:permalink*', () =>
        HttpResponse.json([
          {},
          {kind: 'Listing', data: {after: null, dist: 0, children: []}}
        ])
      )
    )

    render(
      <Comments
        permalink="/r/test/comments/none"
        postLink="/r/test/comments/none"
        open
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/no comments/i)).toBeInTheDocument()
    })
  })

  it('filters out AutoModerator comments', async () => {
    render(
      <Comments
        permalink="/r/test/comments/1"
        postLink="/r/test/comments/1"
        open
      />
    )

    // wait for regular comments to appear
    await screen.findByText('testuser')
    await screen.findByText('anotheruser')

    // Verify AutoModerator comment is not rendered
    expect(screen.queryByText('AutoModerator')).not.toBeInTheDocument()
    expect(
      screen.queryByText('This is an AutoModerator comment')
    ).not.toBeInTheDocument()

    // Verify regular comments are still rendered
    expect(screen.getByText('First comment')).toBeInTheDocument()
    expect(screen.getByText(/Second comment with a/)).toBeInTheDocument()
  })
})
