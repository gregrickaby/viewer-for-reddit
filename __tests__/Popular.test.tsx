import { PopularSubreddits } from '@/components/Popular'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { render, screen, server, waitFor } from './setupTests'

// Create a mock for useInView that we can control in tests.
const mockInView = { ref: vi.fn(), inView: false }
const mockUseInView = vi.fn(() => mockInView)

// Mock react-intersection-observer.
vi.mock('react-intersection-observer', () => ({
  useInView: () => mockUseInView()
}))

describe('PopularSubreddits', () => {
  // Reset mocks before each test.
  beforeEach(() => {
    mockInView.inView = false
    mockUseInView.mockReturnValue(mockInView)
    vi.clearAllMocks()
  })

  it('should render the header text correctly', async () => {
    render(<PopularSubreddits />)

    // Verify the header text is displayed.
    expect(
      screen.getByText(/Or choose a popular subreddit:/)
    ).toBeInTheDocument()
  })

  it('should display loading spinner initially', () => {
    render(<PopularSubreddits />)

    // Verify the loading spinner is displayed.
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should render subreddit items after data is loaded', async () => {
    render(<PopularSubreddits />)

    // Wait for the data to load.
    await waitFor(() => {
      // Verify the Home subreddit is displayed.
      expect(screen.getByText('Home')).toBeInTheDocument()
    })
  })

  it('should handle no data scenario correctly', async () => {
    // Override the handler to return empty data.
    server.use(
      http.get('https://www.reddit.com/subreddits/popular.json', () => {
        return HttpResponse.json({ data: { children: [] } })
      })
    )

    render(<PopularSubreddits />)

    // Should show loading first.
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    // Wait for the data to load.
    await waitFor(() => {
      // Verify the header text is displayed.
      expect(
        screen.getByText(/Or choose a popular subreddit:/)
      ).toBeInTheDocument()
    })

    // Verify no subreddit items are rendered.
    expect(screen.queryByTestId('subreddit-item')).not.toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    // Override handler to simulate a network error.
    server.use(
      http.get('https://www.reddit.com/subreddits/popular.json', () => {
        return HttpResponse.error()
      })
    )

    render(<PopularSubreddits />)

    await waitFor(() => {
      // Verify no subreddit items are rendered.
      expect(screen.queryByTestId('subreddit-item')).not.toBeInTheDocument()
    })
  })

  it('should fetch next page when scrolling to the end', async () => {
    // Mock the RTK Query hook with fetchNextPage tracking.
    const mockFetchNextPage = vi.fn()
    const mockQueryHook = {
      data: {
        pages: [
          {
            data: {
              children: [{ data: { id: '1', display_name: 'Home' } }]
            }
          }
        ]
      },
      isFetching: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      fetchPreviousPage: vi.fn(),
      refetch: vi.fn()
    }

    // Mock the RTK Query hook.
    vi.spyOn(
      await import('../lib/services/publicApi'),
      'useGetPopularSubredditsInfiniteQuery'
    ).mockReturnValue(mockQueryHook)

    // Render with inView = false initially.
    const { rerender } = render(<PopularSubreddits />)

    // Simulate the element coming into view.
    mockInView.inView = true
    mockUseInView.mockReturnValue(mockInView)

    // Re-render to trigger the effect.
    rerender(<PopularSubreddits />)

    await waitFor(() => {
      // Verify fetchNextPage was called.
      expect(mockFetchNextPage).toHaveBeenCalledTimes(1)
    })
  })
})
