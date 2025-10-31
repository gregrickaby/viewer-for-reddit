import {setCommentSortingOption} from '@/lib/store/features/settingsSlice'
import {render, screen} from '@/test-utils'
import {userEvent} from '@testing-library/user-event'
import {CommentSortControls} from './CommentSortControls'

vi.mock('@/lib/store/hooks', async () => {
  const actual = await vi.importActual('@/lib/store/hooks')
  return {
    ...actual,
    useAppDispatch: vi.fn(() => vi.fn())
  }
})

describe('CommentSortControls', () => {
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
    const user = userEvent.setup()
    const mockDispatch = vi.fn()

    const {useAppDispatch} = await import('@/lib/store/hooks')
    vi.mocked(useAppDispatch).mockReturnValue(mockDispatch)

    render(<CommentSortControls />)

    const topButton = screen.getByText('Top')
    await user.click(topButton)

    expect(mockDispatch).toHaveBeenCalledWith(setCommentSortingOption('top'))
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
