import type {AutoPostChildData} from '@/lib/store/services/postsApi'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {CardActions} from './CardActions'

// Mock useSave hook
const mockHandleSave = vi.fn()
vi.mock('@/lib/hooks/util/useSave', () => ({
  useSave: vi.fn(() => ({
    handleSave: mockHandleSave,
    isSaved: false,
    isSaving: false
  }))
}))

// Import after mock to get the mocked version
const {useSave} = await import('@/lib/hooks/util/useSave')

const mockPost: AutoPostChildData = {
  name: 't3_test123',
  ups: 42,
  likes: null,
  num_comments: 15,
  saved: false
}

// Default mock return value for useSave hook
const DEFAULT_MOCK_RETURN = {
  handleSave: mockHandleSave,
  isSaved: false,
  isSaving: false
}

describe('CardActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default mock (not saved)
    vi.mocked(useSave).mockReturnValue(DEFAULT_MOCK_RETURN)
  })

  it('should render vote buttons with correct props', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const upvoteButton = screen.getByLabelText(/upvote/i)
    const downvoteButton = screen.getByLabelText(/downvote/i)

    expect(upvoteButton).toBeInTheDocument()
    expect(downvoteButton).toBeInTheDocument()
  })

  it('should render comments link when not hidden', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const commentsLink = screen.getByRole('link', {
      name: /15 comments/i
    })

    expect(commentsLink).toBeInTheDocument()
    expect(commentsLink).toHaveAttribute(
      'href',
      '/r/test/comments/test123#comments'
    )
  })

  it('should hide comments link when hideCommentToggle is true', () => {
    render(
      <CardActions
        hideCommentToggle
        post={mockPost}
        postLink="/r/test/comments/test123"
      />
    )

    const commentsLink = screen.queryByRole('link', {
      name: /comments/i
    })

    expect(commentsLink).not.toBeInTheDocument()
  })

  it('should format large comment counts with thousand separator', () => {
    const postWithManyComments = {...mockPost, num_comments: 1234}

    render(
      <CardActions
        post={postWithManyComments}
        postLink="/r/test/comments/test123"
      />
    )

    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('should handle post with zero comments', () => {
    const postWithNoComments = {...mockPost, num_comments: 0}

    render(
      <CardActions
        post={postWithNoComments}
        postLink="/r/test/comments/test123"
      />
    )

    const commentsLink = screen.getByRole('link', {
      name: /0 comments/i
    })

    expect(commentsLink).toBeInTheDocument()
  })

  it('should pass Umami event tracking attribute', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const commentsLink = screen.getByRole('link', {
      name: /15 comments/i
    })

    expect(commentsLink).toHaveAttribute(
      'data-umami-event',
      'view comment button'
    )
  })

  it('should render save button with unsaved state by default', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const saveButton = screen.getByRole('button', {name: /save post/i})
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toHaveTextContent('Save')
  })

  it('should render save button with saved state when post is saved', () => {
    vi.mocked(useSave).mockReturnValue({
      handleSave: mockHandleSave,
      isSaved: true,
      isSaving: false
    })

    const savedPost = {...mockPost, saved: true}
    render(<CardActions post={savedPost} postLink="/r/test/comments/test123" />)

    const saveButton = screen.getByRole('button', {name: /unsave post/i})
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).toHaveTextContent('Saved')
  })

  it('should call handleSave when save button is clicked', async () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const saveButton = screen.getByRole('button', {name: /save post/i})
    await user.click(saveButton)

    expect(mockHandleSave).toHaveBeenCalledTimes(1)
  })

  it('should show loading state when saving', () => {
    vi.mocked(useSave).mockReturnValue({
      handleSave: mockHandleSave,
      isSaved: false,
      isSaving: true
    })

    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const saveButton = screen.getByRole('button', {name: /save post/i})
    expect(saveButton).toHaveAttribute('data-loading', 'true')
  })

  it('should pass Umami event tracking attribute to save button', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    const saveButton = screen.getByRole('button', {name: /save post/i})
    expect(saveButton).toHaveAttribute('data-umami-event', 'save post button')
  })

  it('should initialize useSave hook with correct props', () => {
    render(<CardActions post={mockPost} postLink="/r/test/comments/test123" />)

    expect(useSave).toHaveBeenCalledWith({
      id: 't3_test123',
      initialSaved: false
    })
  })

  it('should handle post without saved property', () => {
    const postWithoutSaved = {
      name: 't3_test123',
      ups: 42,
      likes: null,
      num_comments: 15
      // saved property missing
    }

    render(
      <CardActions
        post={postWithoutSaved as AutoPostChildData}
        postLink="/r/test/comments/test123"
      />
    )

    expect(useSave).toHaveBeenCalledWith({
      id: 't3_test123',
      initialSaved: false
    })
  })
})
