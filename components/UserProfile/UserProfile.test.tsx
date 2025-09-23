import {fireEvent, render, screen} from '@/test-utils'
import {vi} from 'vitest'
import {UserProfile} from './UserProfile'

// Mock the components
vi.mock('@/components/UserPosts/UserPosts', () => ({
  UserPosts: ({username, sort}: {username: string; sort: string}) => (
    <div data-testid="user-posts">
      UserPosts: {username} - {sort}
    </div>
  )
}))

vi.mock('@/components/UserComments/UserComments', () => ({
  UserComments: ({username, sort}: {username: string; sort: string}) => (
    <div data-testid="user-comments">
      UserComments: {username} - {sort}
    </div>
  )
}))

describe('UserProfile', () => {
  it('should render posts tab by default', () => {
    render(<UserProfile username="testuser" sort="new" />)

    expect(screen.getByRole('tab', {name: 'Posts'})).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('tab', {name: 'Comments'})).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByTestId('user-posts')).toBeInTheDocument()
    expect(screen.queryByTestId('user-comments')).not.toBeInTheDocument()
  })

  it('should switch to comments tab when clicked', () => {
    render(<UserProfile username="testuser" sort="new" />)

    fireEvent.click(screen.getByRole('tab', {name: 'Comments'}))

    expect(screen.getByRole('tab', {name: 'Posts'})).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByRole('tab', {name: 'Comments'})).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.queryByTestId('user-posts')).not.toBeInTheDocument()
    expect(screen.getByTestId('user-comments')).toBeInTheDocument()
  })

  it('should pass correct props to UserPosts component', () => {
    render(<UserProfile username="spez" sort="top" />)

    expect(screen.getByTestId('user-posts')).toHaveTextContent(
      'UserPosts: spez - top'
    )
  })

  it('should pass correct props to UserComments component', () => {
    render(<UserProfile username="spez" sort="hot" />)

    fireEvent.click(screen.getByRole('tab', {name: 'Comments'}))

    expect(screen.getByTestId('user-comments')).toHaveTextContent(
      'UserComments: spez - hot'
    )
  })

  it('should use default sort when not provided', () => {
    render(<UserProfile username="testuser" />)

    expect(screen.getByTestId('user-posts')).toHaveTextContent(
      'UserPosts: testuser - new'
    )
  })
})
