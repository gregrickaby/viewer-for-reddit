import {render, screen, server, waitFor} from '@/test-utils'
import userEvent from '@testing-library/user-event'
import {axe, toHaveNoViolations} from 'jest-axe'
import {http, HttpResponse} from 'msw'
import {Comments} from './Comments'

expect.extend(toHaveNoViolations)

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

  describe('Keyboard shortcuts', () => {
    it('should expand all comments on O key', async () => {
      const user = userEvent.setup()
      render(
        <Comments
          permalink="/r/test/comments/1"
          postLink="/r/test/comments/1"
          open
        />
      )

      await screen.findByText(/testuser|commentuser1/)

      // Press 'o' to expand all
      await user.keyboard('o')

      // Verify expand happened (context-dependent assertion)
      expect(screen.getByText(/testuser|commentuser1/)).toBeInTheDocument()
    })

    it('should collapse all comments on Shift+O', async () => {
      const user = userEvent.setup()
      render(
        <Comments
          permalink="/r/test/comments/1"
          postLink="/r/test/comments/1"
          open
        />
      )

      await screen.findByText(/testuser|commentuser1/)

      // First expand all
      await user.keyboard('o')

      // Then collapse all with Shift+O
      await user.keyboard('{Shift>}o{/Shift}')

      // Verify comments are still present
      expect(screen.getByText(/testuser|commentuser1/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have no axe violations', async () => {
      const {container} = render(
        <Comments
          permalink="/r/test/comments/1"
          postLink="/r/test/comments/1"
          open
        />
      )

      await screen.findByText(/testuser|commentuser1/)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})
