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

    await screen.findByText(/testuser|commentuser1/)

    const firstComment = screen.getByText(/Great post.*promising/)
    expect(firstComment).toBeInTheDocument()
  })

  it('should should show no comments when none returned', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')
        if (path?.startsWith('/r/test/comments/none')) {
          return HttpResponse.json([
            {},
            {kind: 'Listing', data: {after: null, dist: 0, children: []}}
          ])
        }
        return new HttpResponse(null, {status: 404})
      })
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

    await screen.findByText(/testuser|commentuser1/)
    await screen.findByText(/commentuser2/)

    expect(screen.queryByText('AutoModerator')).not.toBeInTheDocument()
    expect(
      screen.queryByText('This is an AutoModerator comment')
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Great post.*promising/)).toBeInTheDocument()
    expect(
      screen.getByText(/Not another JavaScript framework/)
    ).toBeInTheDocument()
  })
})
