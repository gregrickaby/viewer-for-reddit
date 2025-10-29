import {Saved} from '@/components/Feeds/Saved/Saved'
import {mockPreloadedState, render, screen, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {afterEach, describe, expect, it} from 'vitest'

describe('Saved', () => {
  const createMockResponse = (
    children: unknown[],
    after: string | null = null
  ) => ({
    kind: 'Listing',
    data: {
      children,
      after,
      before: null
    }
  })

  const createMockPost = (id: string, title: string, over_18 = false) => ({
    kind: 't3',
    data: {
      id,
      title,
      subreddit: 'test',
      permalink: `/r/test/comments/${id}/`,
      over_18,
      stickied: false
    }
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should display loading state initially', () => {
    render(<Saved username="testuser" />)
    expect(screen.getByText(/loading saved posts/i)).toBeInTheDocument()
  })

  it('should display saved posts when data is loaded', async () => {
    render(<Saved username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText(/saved post 1/i)).toBeInTheDocument()
      expect(screen.getByText(/saved post 2/i)).toBeInTheDocument()
    })
  })

  it('should filter out comments (only display t3 posts)', async () => {
    render(<Saved username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText(/saved post 1/i)).toBeInTheDocument()
      expect(screen.getByText(/saved post 2/i)).toBeInTheDocument()
    })

    expect(screen.queryByText(/comment 1/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/comment 2/i)).not.toBeInTheDocument()
  })

  it('should display error state when API fails', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    render(<Saved username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText(/Post Not Available/i)).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Reddit servers are experiencing issues/i)
    ).toBeInTheDocument()
  })

  it('should display empty state when user has no saved posts', async () => {
    render(<Saved username="emptyuser" />)

    await waitFor(() => {
      expect(
        screen.getByText(
          /you haven't saved any posts yet. save posts on reddit to view them here/i
        )
      ).toBeInTheDocument()
    })
  })

  it('should filter NSFW posts when setting is disabled', async () => {
    const preloadedState = {
      ...mockPreloadedState,
      settings: {
        ...mockPreloadedState.settings,
        enableNsfw: false
      }
    }

    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([
            createMockPost('nsfw1', 'NSFW Post', true),
            createMockPost('safe1', 'Safe Post', false)
          ])
        )
      })
    )

    render(<Saved username="testuser" />, {preloadedState})

    await waitFor(() => {
      expect(screen.getByText(/safe post/i)).toBeInTheDocument()
      expect(screen.queryByText(/nsfw post/i)).not.toBeInTheDocument()
    })
  })

  it('should display NSFW posts when setting is enabled', async () => {
    const preloadedState = {
      ...mockPreloadedState,
      settings: {
        ...mockPreloadedState.settings,
        enableNsfw: true
      }
    }

    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([createMockPost('nsfw1', 'NSFW Post', true)])
        )
      })
    )

    render(<Saved username="testuser" />, {preloadedState})

    await waitFor(() => {
      expect(screen.getByText(/nsfw post/i)).toBeInTheDocument()
    })
  })
})
