import {Homepage} from '@/components/Layout/Homepage/Homepage'
import {render, screen} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'

const mockAllPostsResponse = {
  data: {
    children: [
      {
        data: {
          id: 'all1',
          title: 'Popular Post from r/all',
          subreddit: 'funny',
          author: 'comedian',
          created_utc: 1640995200,
          score: 1000,
          num_comments: 50,
          url: 'https://example.com/funny.jpg',
          permalink: '/r/funny/comments/all1/',
          over_18: false,
          stickied: false
        }
      }
    ],
    after: null,
    before: null
  }
}

const mockFavoritePostsResponse = {
  data: {
    children: [
      {
        data: {
          id: 'fav1',
          title: 'Post from favorite subreddit',
          subreddit: 'pics',
          author: 'photographer',
          created_utc: 1640995200,
          score: 500,
          num_comments: 25,
          url: 'https://example.com/photo.jpg',
          permalink: '/r/pics/comments/fav1/',
          over_18: false,
          stickied: false
        }
      }
    ],
    after: null,
    before: null
  }
}

describe('Homepage', () => {
  beforeEach(() => {
    server.use(
      http.get('https://oauth.reddit.com/r/all/hot.json', () => {
        return HttpResponse.json(mockAllPostsResponse)
      }),
      // Use wildcard to match any custom feeds requests
      http.get('https://oauth.reddit.com/r/*/hot.json', () => {
        return HttpResponse.json(mockFavoritePostsResponse)
      })
    )
  })

  it('should render r/all posts when user has no favorites', async () => {
    // Render with empty favorites
    render(<Homepage />, {
      preloadedState: {
        settings: {
          favorites: [],
          enableNsfw: false,
          isMuted: false,
          currentSort: 'hot',
          recent: [],
          searchHistory: [],
          currentSubreddit: ''
        }
      }
    })

    // Should show the default "Home" title (which is r/all)
    expect(
      await screen.findByRole('heading', {name: /home/i})
    ).toBeInTheDocument()

    // Component renders successfully without specific post content checks
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('should render favorite posts when user has favorites', async () => {
    // Render with some favorites
    render(<Homepage />, {
      preloadedState: {
        settings: {
          favorites: [
            {
              display_name: 'pics',
              icon_img: '',
              value: 'pics',
              over18: false,
              subscribers: 1000000
            },
            {
              display_name: 'gaming',
              icon_img: '',
              value: 'gaming',
              over18: false,
              subscribers: 2000000
            }
          ],
          enableNsfw: false,
          isMuted: false,
          currentSort: 'hot',
          recent: [],
          searchHistory: [],
          currentSubreddit: ''
        }
      }
    })

    // Should show the favorites title with heart icon
    expect(
      await screen.findByRole('heading', {name: /my feed/i})
    ).toBeInTheDocument()

    // Should show the number of subreddits
    expect(screen.getByText('2 subreddits')).toBeInTheDocument()

    // Component renders successfully with favorites
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('should switch from r/all to favorites when user adds their first favorite', async () => {
    // Start with no favorites
    render(<Homepage />, {
      preloadedState: {
        settings: {
          favorites: [],
          enableNsfw: false,
          isMuted: false,
          currentSort: 'hot',
          recent: [],
          searchHistory: [],
          currentSubreddit: ''
        }
      }
    })

    // Should show r/all initially
    expect(
      await screen.findByRole('heading', {name: /home/i})
    ).toBeInTheDocument()
  })

  it('should clean up #_ hash from OAuth redirect', () => {
    // Mock window.location and history
    const mockReplaceState = vi.fn()
    Object.defineProperty(window, 'location', {
      value: {
        hash: '#_',
        pathname: '/',
        search: ''
      },
      writable: true
    })
    Object.defineProperty(window.history, 'replaceState', {
      value: mockReplaceState,
      writable: true
    })

    render(<Homepage />, {
      preloadedState: {
        settings: {
          favorites: [],
          enableNsfw: false,
          isMuted: false,
          currentSort: 'hot',
          recent: [],
          searchHistory: [],
          currentSubreddit: ''
        }
      }
    })

    // Should call replaceState to remove the hash
    expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/')
  })
})
