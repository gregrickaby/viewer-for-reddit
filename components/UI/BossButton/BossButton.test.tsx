import BossButton from '@/components/UI/BossButton/BossButton'
import {render, screen} from '@/test-utils'

const {useBossButtonMock} = vi.hoisted(() => ({
  useBossButtonMock: vi.fn()
}))

vi.mock('@/lib/hooks/useBossButton', () => ({
  useBossButton: useBossButtonMock
}))

describe('BossButton', () => {
  beforeEach(() => {
    useBossButtonMock.mockReset()
  })

  it('does not render when shouldShow is false', () => {
    useBossButtonMock.mockReturnValue({
      shouldShow: false,
      redirectUrl: 'https://example.com',
      buttonText: 'Boss Button'
    })
    render(<BossButton />)
    expect(
      screen.queryByRole('link', {name: /Boss Button/})
    ).not.toBeInTheDocument()
  })

  it('renders link to redirectUrl when shouldShow is true', () => {
    useBossButtonMock.mockReturnValue({
      shouldShow: true,
      redirectUrl: 'https://example.com',
      buttonText: 'Boss Button'
    })
    render(<BossButton />)
    const link = screen.getByRole('link', {name: /Boss Button/})
    expect(link).toHaveAttribute('href', 'https://example.com')
  })
})
