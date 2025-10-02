import {LoginButton} from '@/components/Auth/LoginButton'
import {render, screen, userEvent} from '@/test-utils'

describe('LoginButton', () => {
  beforeEach(() => {
    // Reset window.location before each test
    delete (window as any).location
    window.location = {href: ''} as any
  })

  it('should render login button with correct text', () => {
    render(<LoginButton />)
    expect(screen.getByRole('button')).toHaveTextContent('Sign in with Reddit')
  })

  it('should have correct aria-label', () => {
    render(<LoginButton />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Sign in with Reddit'
    )
  })

  it('should redirect to login endpoint when clicked', async () => {
    const user = userEvent.setup()
    render(<LoginButton />)
    const button = screen.getByRole('button')

    await user.click(button)

    expect(window.location.href).toBe('/api/auth/login')
  })

  it('should render with custom variant', () => {
    render(<LoginButton variant="outline" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render with custom size', () => {
    render(<LoginButton size="lg" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render as full width when specified', () => {
    render(<LoginButton fullWidth />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})
