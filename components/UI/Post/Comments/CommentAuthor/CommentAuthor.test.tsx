import {render, screen} from '@/test-utils'
import {CommentAuthor} from './CommentAuthor'

describe('CommentAuthor', () => {
  it('should render active author as a link', () => {
    render(<CommentAuthor author="testuser" />)

    const link = screen.getByRole('link', {name: /u\/testuser/i})
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/u/testuser')
  })

  it('should render deleted author as plain text', () => {
    render(<CommentAuthor author="[deleted]" />)

    expect(screen.getByText('u/[deleted]')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should render removed author as plain text', () => {
    render(<CommentAuthor author="[removed]" />)

    expect(screen.getByText('u/[removed]')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('should render undefined author as [deleted]', () => {
    render(<CommentAuthor author={undefined} />)

    expect(screen.getByText('u/[deleted]')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
