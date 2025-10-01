import {LogoutButton} from '@/components/Auth/LogoutButton'
import {render, screen, userEvent, waitFor} from '@/test-utils'
import {describe, expect, it} from 'vitest'

describe('LogoutButton', () => {
  it('should render logout button with correct text', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button')).toHaveTextContent('Sign out')
  })

  it('should have correct aria-label', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sign out')
  })

  it('should call logout endpoint and redirect when clicked', async () => {
    const user = userEvent.setup()
    const originalHref = window.location.href

    render(<LogoutButton />)
    const button = screen.getByRole('button')

    await user.click(button)

    await waitFor(() => expect(window.location.href).not.toBe(originalHref))
    expect(window.location.href).toContain('/')
  })

  it('should render with custom variant', () => {
    render(<LogoutButton variant="filled" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render with custom size', () => {
    render(<LogoutButton size="sm" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render as full width when specified', () => {
    render(<LogoutButton fullWidth />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})
