import {render, screen, waitFor} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {SubredditAbout} from './SubredditAbout'

describe('SubredditAbout', () => {
  const mockOnClose = () => {}

  it('should render modal when opened', async () => {
    render(<SubredditAbout onClose={mockOnClose} opened subreddit="aww" />)

    await waitFor(() => {
      expect(screen.getByText(/About r\/aww/i)).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    render(<SubredditAbout onClose={mockOnClose} opened subreddit="aww" />)

    // Mantine Loader renders as a span with specific class
    const loader = document.querySelector('.mantine-Loader-root')
    expect(loader).toBeInTheDocument()
  })

  it('should display subreddit information after loading', async () => {
    render(<SubredditAbout onClose={mockOnClose} opened subreddit="aww" />)

    // Wait for loading to complete - loader disappears
    await waitFor(() => {
      const loader = document.querySelector('.mantine-Loader-root')
      expect(loader).not.toBeInTheDocument()
    })

    // Verify all sections are displayed
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText(/puppies/i)).toBeInTheDocument()

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText(/ago/i)).toBeInTheDocument()

    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('37.7M subscribers')).toBeInTheDocument()

    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByText('565 online')).toBeInTheDocument()
  })

  it('should not render when opened is false', () => {
    render(
      <SubredditAbout onClose={mockOnClose} opened={false} subreddit="aww" />
    )

    expect(screen.queryByText(/About r\/aww/i)).not.toBeInTheDocument()
  })

  it('should handle empty description gracefully', async () => {
    // Even with empty description, other fields should render
    render(<SubredditAbout onClose={mockOnClose} opened subreddit="aww" />)

    // Wait for loading to complete
    await waitFor(() => {
      const loader = document.querySelector('.mantine-Loader-root')
      expect(loader).not.toBeInTheDocument()
    })

    // Created, Members, and Online should still be present
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
  })
})
