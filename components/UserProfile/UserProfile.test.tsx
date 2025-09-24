import {render, screen} from '@/test-utils'
import {UserProfile} from './UserProfile'

describe('UserProfile', () => {
  it('should render user profile heading with username', () => {
    render(<UserProfile username="testuser" />)

    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      'User Profile: u/testuser'
    )
  })

  it('should display JSON data structure', () => {
    render(<UserProfile username="testuser" />)

    const preElement = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'pre' &&
        content.includes('"profile"')
      )
    })
    expect(preElement).toBeInTheDocument()
  })
})
