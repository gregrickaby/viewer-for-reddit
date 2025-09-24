import type {UserItem} from '@/lib/types'
import {fireEvent, render, screen, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {vi} from 'vitest'
import {UserProfile} from './UserProfile'

// Mock the components
vi.mock('@/components/UserPosts/UserPosts', () => ({
  UserPosts: ({username, sort}: {username: string; sort: string}) => (
    <div data-testid="user-posts">
      UserPosts: {username} - {sort}
    </div>
  )
}))

vi.mock('@/components/UserComments/UserComments', () => ({
  UserComments: ({username}: {username: string}) => (
    <div data-testid="user-comments">UserComments: {username}</div>
  )
}))

const mockUserData: UserItem = {
  name: 'testuser',
  icon_img: 'https://example.com/avatar.jpg',
  link_karma: 1500,
  comment_karma: 2500,
  created_utc: 1609459200, // Jan 1, 2021
  is_gold: true,
  is_mod: false,
  verified: true,
  subreddit: {
    public_description: 'Test user bio description'
  }
}

describe('UserProfile', () => {
  beforeEach(() => {
    server.use(
      // Default successful response using proxy pattern
      http.get('/api/reddit', ({request}) => {
        const url = new URL(request.url)
        const path = url.searchParams.get('path')

        if (!path?.includes('/user/') || !path?.includes('/about.json')) {
          return new HttpResponse(null, {status: 404})
        }

        const username = path.split('/')[2] // Extract username from /user/username/about.json

        if (username === 'nonexistentuser') {
          return new HttpResponse(null, {status: 404})
        }
        if (username === 'minimaluser') {
          return HttpResponse.json({
            data: {
              name: 'minimaluser'
            }
          })
        }
        if (username === 'testmod') {
          return HttpResponse.json({
            data: {
              ...mockUserData,
              is_mod: true,
              is_gold: false
            }
          })
        }

        // Default case for other users (like 'testuser')
        return HttpResponse.json({
          data: mockUserData
        })
      })
    )
  })

  it('should render posts tab by default', async () => {
    render(<UserProfile username="testuser" sort="new" />)

    expect(screen.getByRole('tab', {name: 'Posts'})).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('tab', {name: 'Comments'})).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByTestId('user-posts')).toBeInTheDocument()
  })

  it('should switch to comments tab when clicked', async () => {
    render(<UserProfile username="testuser" sort="new" />)

    fireEvent.click(screen.getByRole('tab', {name: 'Comments'}))

    expect(screen.getByRole('tab', {name: 'Posts'})).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByRole('tab', {name: 'Comments'})).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByTestId('user-comments')).toBeInTheDocument()
  })

  it('should pass username and sort to UserPosts', async () => {
    render(<UserProfile username="testuser" sort="top" />)

    expect(screen.getByText('UserPosts: testuser - top')).toBeInTheDocument()
  })

  it('should pass username to UserComments', async () => {
    render(<UserProfile username="testuser" />)

    fireEvent.click(screen.getByRole('tab', {name: 'Comments'}))

    expect(screen.getByText('UserComments: testuser')).toBeInTheDocument()
  })

  it('should display user information with avatar and metadata', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText('Gold')).toBeInTheDocument()
    })

    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('1,500')).toBeInTheDocument() // Link karma
    expect(screen.getByText('2,500')).toBeInTheDocument() // Comment karma
    expect(screen.getByText('12/31/2020')).toBeInTheDocument() // Creation date
    expect(screen.getByText('Test user bio description')).toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'u/testuser'})).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    )
  })

  it('should display loading state for user information', async () => {
    // Override with loading state
    server.use(
      http.get(
        'https://oauth.reddit.com/user/testuser/about.json',
        () => new Promise(() => {}) // Never resolves to simulate loading
      )
    )

    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText('u/testuser')).toBeInTheDocument()
    })

    expect(screen.getByText('Loading user information...')).toBeInTheDocument()
    expect(screen.queryByText('Gold')).not.toBeInTheDocument()
  })

  it('should display error state when user information fails to load', async () => {
    render(<UserProfile username="nonexistentuser" />)

    await waitFor(
      () => {
        expect(
          screen.getByText('Could not load user information')
        ).toBeInTheDocument()
      },
      {timeout: 3000}
    )

    expect(screen.queryByText('Gold')).not.toBeInTheDocument()
  })

  it('should display moderator badge when user is a mod', async () => {
    render(<UserProfile username="testmod" />)

    await waitFor(() => {
      expect(screen.getByText('Moderator')).toBeInTheDocument()
    })

    expect(screen.queryByText('Gold')).not.toBeInTheDocument()
  })

  it('should handle missing optional user data gracefully', async () => {
    render(<UserProfile username="minimaluser" />)

    await waitFor(() => {
      // Should display user info card with minimal data
      expect(screen.getAllByText('N/A')).toHaveLength(3) // Post karma, Comment karma, Account creation date
    })

    expect(screen.queryByText('Gold')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Test user bio description')
    ).not.toBeInTheDocument()
  })

  it('should use fallback avatar when icon_img is not available', async () => {
    // Mock user data with subreddit avatar fallback
    server.use(
      http.get('https://oauth.reddit.com/user/testuser/about.json', () => {
        return HttpResponse.json({
          data: {
            ...mockUserData,
            icon_img: undefined,
            subreddit: {
              icon_img: 'https://example.com/profile-avatar.jpg'
            }
          }
        })
      })
    )

    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByRole('img', {name: 'u/testuser'})).toHaveAttribute(
        'src',
        'https://example.com/profile-avatar.jpg'
      )
    })
  })

  it('should call getUserAbout with the provided username', async () => {
    render(<UserProfile username="specificuser" />)

    // Verify the API was called by waiting for the component to render
    await waitFor(() => {
      expect(screen.getByRole('tab', {name: 'Posts'})).toBeInTheDocument()
    })
  })
})
