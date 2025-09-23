import type {AutoCommentData} from '@/lib/store/services/redditApi'
import {render, screen} from '@/test-utils'
import {Comments} from './Comments'

const mockComment: AutoCommentData = {
  id: 'test123',
  author: 'testuser',
  body: 'This is a test comment',
  body_html: '&lt;p&gt;This is a test comment&lt;/p&gt;',
  created_utc: 1672531200, // Jan 1, 2023
  ups: 42,
  subreddit: 'programming',
  permalink: '/r/programming/comments/abc123/test_post/test123/',
  link_title: 'Test Post Title'
} as AutoCommentData

describe('Comments', () => {
  it('should render comment with author and content', () => {
    render(<Comments comment={mockComment} />)

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('This is a test comment')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('View on Reddit')).toBeInTheDocument()
  })

  it('should show context when showContext is true', () => {
    render(<Comments comment={mockComment} showContext />)

    expect(screen.getByText('in r/programming')).toBeInTheDocument()
    expect(screen.getByText('Re: Test Post Title')).toBeInTheDocument()
  })

  it('should hide context when showContext is false', () => {
    render(<Comments comment={mockComment} showContext={false} />)

    expect(screen.queryByText('in r/programming')).not.toBeInTheDocument()
    expect(screen.queryByText('Re: Test Post Title')).not.toBeInTheDocument()
  })

  it('should hide score when showScore is false', () => {
    render(<Comments comment={mockComment} showScore={false} />)

    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('should handle missing optional fields gracefully', () => {
    const minimalComment: AutoCommentData = {
      id: 'minimal123',
      body: 'Minimal comment'
    } as AutoCommentData

    render(<Comments comment={minimalComment} showContext />)

    expect(screen.getByText('Minimal comment')).toBeInTheDocument()
    expect(screen.queryByText('View on Reddit')).not.toBeInTheDocument()
    expect(screen.queryByText('in r/')).not.toBeInTheDocument()
  })

  it('should return null for null comment', () => {
    render(<Comments comment={null as any} />)

    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('should format time correctly', () => {
    render(<Comments comment={mockComment} />)

    // Should show a formatted time ago string
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it('should render HTML content safely', () => {
    const htmlComment: AutoCommentData = {
      ...mockComment,
      body_html:
        '&lt;p&gt;Safe &lt;strong&gt;HTML&lt;/strong&gt; content&lt;/p&gt;'
    }

    render(<Comments comment={htmlComment} />)

    // Check that HTML is rendered (decodeAndSanitizeHtml should handle this)
    // Just verify the content exists by searching for the strong element
    expect(screen.getByRole('article')).toBeInTheDocument()

    // Check that the strong element exists (indicating HTML was parsed)
    const strongElement = screen.getByRole('article').querySelector('strong')
    expect(strongElement).toBeInTheDocument()
    expect(strongElement?.textContent).toBe('HTML')
  })
})
