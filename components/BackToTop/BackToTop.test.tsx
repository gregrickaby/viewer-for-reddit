import BackToTop from '@/components/BackToTop/BackToTop'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {scrollRef, scrollToMock} = vi.hoisted(() => ({
  scrollRef: {y: 0},
  scrollToMock: vi.fn()
}))

vi.mock('@mantine/hooks', () => ({
  useWindowScroll: () => [scrollRef, scrollToMock]
}))

describe('BackToTop', () => {
  beforeEach(() => {
    scrollRef.y = 0
    scrollToMock.mockClear()
  })

  it('does not render when scrolled less than or equal to 200', () => {
    scrollRef.y = 100
    render(<BackToTop />)
    expect(
      screen.queryByRole('button', {name: 'Go back to the top of the page'})
    ).not.toBeInTheDocument()
  })

  it('renders button and scrolls to top when clicked', async () => {
    scrollRef.y = 250
    render(<BackToTop />)
    const button = screen.getByRole('button', {
      name: 'Go back to the top of the page'
    })
    await userEvent.click(button)
    expect(scrollToMock).toHaveBeenCalledWith({y: 0})
  })
})
