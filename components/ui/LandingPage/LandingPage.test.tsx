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

  it('renders the meta description', () => {
    render(<LandingPage />)

    expect(
      screen.getByText(
        /Reddit Viewer is a clean way to browse Reddit without ads, analytics, or algorithms/i
      )
    ).toBeInTheDocument()
  })

  it('renders features section', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', {level: 2, name: /why reddit viewer/i})
    ).toBeInTheDocument()
    expect(screen.getByText(/No Ads/i)).toBeInTheDocument()
    expect(screen.getByText(/No Tracking/i)).toBeInTheDocument()
    expect(screen.getByText(/No Algorithms/i)).toBeInTheDocument()
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

  it('renders structured data script', () => {
    render(<LandingPage />)

    const script = screen.getByTestId('landing-page-schema')
    expect(script).toBeInTheDocument()
    expect(script).toHaveAttribute('type', 'application/ld+json')
  })

  it('has no accessibility violations', async () => {
    const {container} = render(<LandingPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
