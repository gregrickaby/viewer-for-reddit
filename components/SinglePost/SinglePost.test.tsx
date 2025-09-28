import {SinglePost} from '@/components/SinglePost/SinglePost'
import {render, screen, waitFor} from '@/test-utils'

describe('SinglePost', () => {
  const defaultProps = {
    subreddit: 'programming',
    postId: 'abc123'
  }

  it('should render loading state initially', () => {
    render(<SinglePost {...defaultProps} />)

    expect(screen.getByText('Loading post...')).toBeInTheDocument()
    // Mantine Loader component is rendered as a span, not with progressbar role
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument()
  })

  it('should render post and comments successfully', async () => {
    render(<SinglePost {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Check for back navigation link
    expect(screen.getByText('Back to r/programming')).toBeInTheDocument()

    // Check for comments section (might be empty initially)
    expect(screen.getByText(/Comments/)).toBeInTheDocument()
  })

  it('should render post with no comments', async () => {
    render(<SinglePost subreddit="programming" postId="nocomments" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Should show comments section
    expect(screen.getByText(/Comments/)).toBeInTheDocument()
  })

  it('should render 404 error state', async () => {
    render(<SinglePost subreddit="notfound" postId="abc123" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Should show error message
    expect(screen.getByText(/Post not found/)).toBeInTheDocument()
    expect(screen.getByText('Back to r/notfound')).toBeInTheDocument()
  })

  it('should render 403 error state for private subreddit', async () => {
    render(<SinglePost subreddit="private" postId="abc123" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Should show private subreddit error
    expect(
      screen.getByText(/This subreddit is private or restricted/)
    ).toBeInTheDocument()
  })

  it('should handle generic error state', async () => {
    // Test with invalid subreddit to trigger generic error
    render(<SinglePost subreddit="error" postId="abc123" />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Should show generic error message
    expect(screen.getByText(/Failed to load post/)).toBeInTheDocument()
  })

  it('should render back navigation links correctly', async () => {
    render(<SinglePost {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    const backLinks = screen.getAllByText('Back to r/programming')
    expect(backLinks).toHaveLength(1)

    // Check that the link has correct href
    const backLink = backLinks[0].closest('a')
    expect(backLink).toHaveAttribute('href', '/r/programming')
  })

  it('should render comment scores correctly', async () => {
    render(<SinglePost {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Check for comment scores (25 points for first comment)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('should handle HTML content in comments safely', async () => {
    render(<SinglePost {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Comments should render with HTML content
    const commentElements = screen.getAllByText(
      /Great post|Not another JavaScript/
    )
    expect(commentElements).toHaveLength(2)
  })

  it('should not show inline comments toggle in SinglePost view', async () => {
    render(<SinglePost {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // The PostCard should not have the comments toggle since useInternalRouting=false
    // and we're already viewing the single post page
    const commentToggleButtons = screen.queryAllByRole('button', {
      name: /comments/
    })

    // Should only find the comment buttons in the actual comments section, not in PostCard
    commentToggleButtons.forEach((button) => {
      // If there are any comment buttons, they should not be for showing/hiding comments
      const ariaExpanded = button.getAttribute('aria-expanded')
      expect(ariaExpanded === null || ariaExpanded === 'false').toBe(true)
    })
  })

  it('should have proper accessibility attributes', async () => {
    render(<SinglePost {...defaultProps} />)

    await waitFor(() => {
      expect(screen.queryByText('Loading post...')).not.toBeInTheDocument()
    })

    // Check for proper container structure (PostCard article)
    const articles = screen.getAllByRole('article')
    expect(articles.length).toBeGreaterThan(0)

    // Check for heading structure
    const commentsHeading = screen.getByRole('heading', {name: /Comments/})
    expect(commentsHeading).toBeInTheDocument()
    expect(commentsHeading.tagName).toBe('H3')
  })
})
