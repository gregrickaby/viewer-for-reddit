import {render, screen, server, waitFor} from '@/test-utils'
import {http, HttpResponse} from 'msw'
import {Comments} from './Comments'

describe('Comments', () => {
  it('should should render comments from MSW and decodes HTML entities', async () => {
    render(
      <Comments
        permalink="/r/test/comments/1"
        postLink="/r/test/comments/1"
        open
      />
    )

    await screen.findByText('testuser')

    const firstComment = screen.getByText('First comment')
    expect(firstComment).toBeInTheDocument()

    const link = screen.getByRole('link', {name: 'link'})
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('should should show no comments when none returned', async () => {
    server.use(
      http.get('https://oauth.reddit.com/r/test/comments/none.json', () =>
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

  it('should filter out AutoModerator comments', async () => {
    render(
      <Comments
        permalink="/r/test/comments/1"
        postLink="/r/test/comments/1"
        open
      />
    )

    await screen.findByText('testuser')
    await screen.findByText('anotheruser')

    expect(screen.queryByText('AutoModerator')).not.toBeInTheDocument()
    expect(
      screen.queryByText('This is an AutoModerator comment')
    ).not.toBeInTheDocument()
    expect(screen.getByText('First comment')).toBeInTheDocument()
    expect(screen.getByText(/Second comment with a/)).toBeInTheDocument()
  })
})
