import {render, screen, waitFor} from '@/test-utils'
import userEvent from '@testing-library/user-event'
import {UserProfile} from './UserProfile'

describe('UserProfile', () => {
  it('should render user profile after loading', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      const usernames = screen.getAllByText(/u\/testuser/i)
      expect(usernames.length).toBeGreaterThan(0)
    })

    expect(screen.getByRole('tab', {name: /posts/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /comments/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /profile/i})).toBeInTheDocument()
  })

  it('should display verification badges for verified user', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument()
    })
  })

  it('should display user posts in Posts tab', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByRole('tab', {name: /Posts/})).toBeInTheDocument()
    })

    expect(screen.getByText(/Posts \(\d+\+?\)/)).toBeInTheDocument()
  })

  it('should display user comments in Comments tab', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByRole('tab', {name: /Comments/})).toBeInTheDocument()
    })

    expect(screen.getByText(/Comments \(\d+\+?\)/)).toBeInTheDocument()
  })

  it('should show "+" suffix only when there are more items available', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByRole('tab', {name: /Posts/})).toBeInTheDocument()
    })

    expect(screen.getByText(/Posts \(\d+\+\)/)).toBeInTheDocument()
    expect(screen.getByText(/Comments \(\d+\+\)/)).toBeInTheDocument()
  })

  it('should handle user not found error', async () => {
    render(<UserProfile username="nonexistentuser" />)

    await waitFor(() => {
      expect(
        screen.getByText(/unable to load profile from reddit api/i)
      ).toBeInTheDocument()
    })
  })

  it('should display karma statistics correctly', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText('12,345')).toBeInTheDocument()
    })

    expect(screen.getByText('67,890')).toBeInTheDocument()
    expect(screen.getByText('80,235')).toBeInTheDocument()
  })

  it('should show user created date when profile tab is clicked', async () => {
    const user = userEvent.setup()
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      const usernames = screen.getAllByText(/u\/testuser/i)
      expect(usernames.length).toBeGreaterThan(0)
    })

    const profileTab = screen.getByRole('tab', {name: /profile/i})
    await user.click(profileTab)

    await waitFor(() => {
      expect(screen.getAllByText(/ago/)[0]).toBeInTheDocument()
    })
  })

  it('should display user avatar with fallback', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      const avatars = screen.getAllByAltText('u/testuser')
      expect(avatars.length).toBeGreaterThan(0)
    })

    const avatars = screen.getAllByAltText('u/testuser')
    expect(avatars[0]).toBeInTheDocument()
  })

  it('should display user profile description when available', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByText('A test user for mocking')).toBeInTheDocument()
    })
  })

  it('should switch between tabs correctly', async () => {
    render(<UserProfile username="testuser" />)

    await waitFor(() => {
      expect(screen.getByRole('tab', {name: /Posts/})).toBeInTheDocument()
    })

    expect(screen.getByRole('tab', {name: /Posts/})).toHaveAttribute(
      'aria-selected',
      'true'
    )

    const commentsTab = screen.getByRole('tab', {name: /Comments/})
    commentsTab.click()

    await waitFor(() => {
      expect(commentsTab).toHaveAttribute('aria-selected', 'true')
    })

    const profileTab = screen.getByRole('tab', {name: 'Profile'})
    profileTab.click()

    await waitFor(() => {
      expect(profileTab).toHaveAttribute('aria-selected', 'true')
    })
  })
})
