import {render, screen, user} from '@/test-utils'
import {CommentSortControls} from './CommentSortControls'

const mockDispatch = vi.fn()

vi.mock('@/lib/store/hooks', async () => {
  const actual = await vi.importActual('@/lib/store/hooks')
  return {
    ...actual,
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn((selector) =>
      selector({settings: {commentSort: 'best'}})
    )
  }
})

describe('CommentSortControls', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
  })

  it('should render with default "best" sorting', () => {
    render(<CommentSortControls />)

    expect(screen.getByText('Sort by:')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it.each([
    ['Best', 'best'],
    ['Top', 'top'],
    ['New', 'new'],
    ['Controversial', 'controversial']
  ])('renders %s sorting option', (label) => {
    render(<CommentSortControls />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('should dispatch setCommentSortingOption when sorting changes', async () => {
    render(<CommentSortControls />)

    // Click on "Top" option
    await user.click(screen.getByText('Top'))

    // Verify dispatch was called
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'settings/setCommentSortingOption',
        payload: 'top'
      })
    )
  })

  it('should have Umami analytics tracking attributes', () => {
    render(<CommentSortControls />)

    const segmentedControl = screen.getByRole('radiogroup')
    expect(segmentedControl).toHaveAttribute(
      'data-umami-event',
      'sort comments'
    )
  })
})
