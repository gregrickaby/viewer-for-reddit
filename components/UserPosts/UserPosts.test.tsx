import {UserPosts} from '@/components/UserPosts/UserPosts'
import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'

describe('UserPosts', () => {
  it('should render loading state initially', () => {
    render(<UserPosts username="testuser" sort="new" />)

    // Should show loading spinner (Mantine Loader)
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
  })

  it('should render no posts message when user has no posts', async () => {
    render(<UserPosts username="nonexistentuser" sort="new" />)

    // Should show no posts message instead of error for valid user with no posts
    const noPostsMessage = await screen.findByText(
      'No posts found from this user!'
    )
    expect(noPostsMessage).toBeInTheDocument()
  })

  it('should render user posts title with correct username', async () => {
    render(<UserPosts username="spez" sort="hot" />)

    // Wait for the title to appear after loading
    const title = await screen.findByText(/Posts from u\/spez/)
    expect(title).toBeInTheDocument()
  })

  it('should render sorting controls', async () => {
    render(<UserPosts username="testuser" sort="new" />)

    // Wait for component to load and show sorting controls
    await screen.findByRole('radiogroup')

    // Should show sorting options in segmented control
    expect(screen.getByRole('radio', {name: 'New'})).toBeInTheDocument()
    expect(screen.getByRole('radio', {name: 'Hot'})).toBeInTheDocument()
    expect(screen.getByRole('radio', {name: 'Top'})).toBeInTheDocument()
  })
})
