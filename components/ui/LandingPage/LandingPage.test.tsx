import {render, screen} from '@/test-utils'
import {axe} from 'jest-axe'
import {describe, expect, it} from 'vitest'
import {LandingPage} from './LandingPage'

describe('LandingPage', () => {
  it('renders the app name', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      'Reddit Viewer'
    )
  })

  it('renders the tagline', () => {
    render(<LandingPage />)

    expect(
      screen.getByText(/Surf Reddit without ads, analytics, and algorithms/i)
    ).toBeInTheDocument()
  })

  it('explains why login is required', () => {
    render(<LandingPage />)

    expect(
      screen.getByText(/reddit requires authentication/i)
    ).toBeInTheDocument()
  })

  it('renders sign in button linking to login route', () => {
    render(<LandingPage />)

    const button = screen.getByRole('link', {name: /sign in with reddit/i})
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('href', '/api/auth/login')
  })

  it('renders learn more link to about page', () => {
    render(<LandingPage />)

    const link = screen.getByRole('link', {name: /learn more/i})
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/about')
  })

  it('has no accessibility violations', async () => {
    const {container} = render(<LandingPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
