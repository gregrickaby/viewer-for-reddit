import {Custom} from '@/components/Feeds/Custom/Custom'
import {render, screen, user, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'

describe('CustomFeedPosts', () => {
  const defaultProps = {
    username: 'testuser',
    customFeedName: 'testfeed',
    sort: 'hot' as const
  }

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
      author: 'testuser',
      score: 100,
      num_comments: 10,
      created_utc: 1234567890,
      permalink: `/r/test/comments/${id}/test_post/`,
      url: 'https://example.com',
      over_18,
      stickied: false
    }
  })

  it('should render loading state initially', () => {
    render(<Custom {...defaultProps} />)

    expect(screen.getByText('Loading custom feed posts...')).toBeInTheDocument()
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
  })

  it('should render posts after loading', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')

        if (path?.includes('/user/testuser/m/testfeed/hot.json')) {
          return HttpResponse.json(
            createMockResponse([createMockPost('1', 'Test Post')])
          )
        }

        return new HttpResponse(null, {status: 404})
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
  })

  it('should render error state on API failure', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return new HttpResponse(null, {status: 500})
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Post Not Available/i)).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Reddit servers are experiencing issues/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Go Back'})).toBeInTheDocument()
  })

  it('should render authentication error for 401 status', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return new HttpResponse(null, {status: 401})
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Post Not Available/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Failed to load post/i)).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'Go Back'})).toBeInTheDocument()
  })

  it('should render empty state when no posts are available', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(createMockResponse([]))
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByText('No posts found in this custom feed.')
      ).toBeInTheDocument()
    })
  })

  it('should filter NSFW posts when enableNsfw is false', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([
            createMockPost('safe123', 'Safe Post', false),
            createMockPost('nsfw123', 'NSFW Post', true)
          ])
        )
      })
    )

    render(<Custom {...defaultProps} />, {
      preloadedState: {
        settings: {
          enableNsfw: false,
          currentSort: 'hot',
          currentSubreddit: null,
          favorites: [],
          isMuted: false,
          recent: [],
          searchHistory: [],
          commentSort: 'best'
        }
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Safe Post')).toBeInTheDocument()
    })

    expect(screen.queryByText('NSFW Post')).not.toBeInTheDocument()
  })

  it('should show NSFW posts when enableNsfw is true', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([
            createMockPost('safe123', 'Safe Post', false),
            createMockPost('nsfw123', 'NSFW Post', true)
          ])
        )
      })
    )

    render(<Custom {...defaultProps} />, {
      preloadedState: {
        settings: {
          enableNsfw: true,
          currentSort: 'hot',
          currentSubreddit: null,
          favorites: [],
          isMuted: false,
          recent: [],
          searchHistory: [],
          commentSort: 'best'
        }
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Safe Post')).toBeInTheDocument()
    })

    expect(screen.getByText('NSFW Post')).toBeInTheDocument()
  })

  it('should handle different sort options', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([createMockPost('1', 'Test Post')])
        )
      })
    )

    const sortOptions = ['hot', 'new', 'top', 'rising'] as const

    for (const sort of sortOptions) {
      const {unmount} = render(<Custom {...defaultProps} sort={sort} />)

      await waitFor(() => {
        expect(
          screen.queryByText('Loading custom feed posts...')
        ).not.toBeInTheDocument()
      })

      unmount()
    }
  })

  it('should skip rendering posts without data', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json({
          kind: 'Listing',
          data: {
            children: [
              createMockPost('valid123', 'Valid Post'),
              {kind: 't3', data: null},
              {kind: 't3'}
            ],
            after: null,
            before: null
          }
        })
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Valid Post')).toBeInTheDocument()
    })

    const articles = document.querySelectorAll('article')
    expect(articles.length).toBe(1)
  })

  it('should show end message when all posts are loaded', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([createMockPost('post123', 'Test Post')], null)
        ) // null after means no more pages
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText("You've reached the end")).toBeInTheDocument()
    })
  })

  it('should render sort control with Hot, New, and Top options', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([createMockPost('1', 'Test Post')])
        )
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    expect(screen.getByRole('radio', {name: 'Hot'})).toBeInTheDocument()
    expect(screen.getByRole('radio', {name: 'New'})).toBeInTheDocument()
    expect(screen.getByRole('radio', {name: 'Top'})).toBeInTheDocument()
  })

  it('should have the correct sort option selected based on prop', async () => {
    server.use(
      http.get('http://localhost:3000/api/reddit/me', () => {
        return HttpResponse.json(
          createMockResponse([createMockPost('1', 'Test Post')])
        )
      })
    )

    render(<Custom {...defaultProps} sort="new" />)

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    expect(screen.getByRole('radio', {name: 'New'})).toBeChecked()
    expect(screen.getByRole('radio', {name: 'Hot'})).not.toBeChecked()
    expect(screen.getByRole('radio', {name: 'Top'})).not.toBeChecked()
  })

  it('should update selected sort when clicking different option', async () => {
    let requestedSort = 'hot'

    server.use(
      http.get('http://localhost:3000/api/reddit/me', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')

        // Capture which sort was requested
        if (path?.includes('/new.json')) {
          requestedSort = 'new'
        } else if (path?.includes('/top.json')) {
          requestedSort = 'top'
        }

        return HttpResponse.json(
          createMockResponse([createMockPost('1', 'Test Post')])
        )
      })
    )

    render(<Custom {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })

    // Click New option
    await user.click(screen.getByRole('radio', {name: 'New'}))

    await waitFor(() => {
      expect(screen.getByRole('radio', {name: 'New'})).toBeChecked()
      expect(requestedSort).toBe('new')
    })

    // Click Top option
    await user.click(screen.getByRole('radio', {name: 'Top'}))

    await waitFor(() => {
      expect(screen.getByRole('radio', {name: 'Top'})).toBeChecked()
      expect(requestedSort).toBe('top')
    })
  })
})
