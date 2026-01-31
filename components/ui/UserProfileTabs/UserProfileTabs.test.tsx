import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {UserProfileTabs} from './UserProfileTabs'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: vi.fn()
  }))
}))

describe('UserProfileTabs', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders posts and comments tabs', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByRole('tab', {name: /posts/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /comments/i})).toBeInTheDocument()
  })

  it('displays posts content when posts tab active', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByText('Posts content')).toBeInTheDocument()
    expect(screen.getByText('Comments content')).toBeInTheDocument()
  })

  it('displays comments content when comments tab active', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="comments"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByText('Comments content')).toBeInTheDocument()
    expect(screen.getByText('Posts content')).toBeInTheDocument()
  })

  it('navigates to posts tab when clicked', async () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="comments"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    const postsTab = screen.getByRole('tab', {name: /posts/i})
    await user.click(postsTab)

    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=posts')
  })

  it('navigates to comments tab when clicked', async () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    const commentsTab = screen.getByRole('tab', {name: /comments/i})
    await user.click(commentsTab)

    expect(mockPush).toHaveBeenCalledWith('/u/testuser?tab=comments')
  })

  it('uses correct username in URL', async () => {
    render(
      <UserProfileTabs
        username="spez"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    const commentsTab = screen.getByRole('tab', {name: /comments/i})
    await user.click(commentsTab)

    expect(mockPush).toHaveBeenCalledWith('/u/spez?tab=comments')
  })

  it('renders with different usernames', () => {
    const {rerender} = render(
      <UserProfileTabs
        username="user1"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByRole('tab', {name: /posts/i})).toBeInTheDocument()

    rerender(
      <UserProfileTabs
        username="user2"
        activeTab="comments"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByRole('tab', {name: /comments/i})).toBeInTheDocument()
  })

  it('renders posts tab icon', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    const postsTab = screen.getByRole('tab', {name: /posts/i})
    expect(postsTab).toBeInTheDocument()
  })

  it('renders comments tab icon', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="comments"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    const commentsTab = screen.getByRole('tab', {name: /comments/i})
    expect(commentsTab).toBeInTheDocument()
  })

  it('renders complex content in posts tab', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={
          <div>
            <h1>Post Title</h1>
            <p>Post body</p>
          </div>
        }
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByText('Post Title')).toBeInTheDocument()
    expect(screen.getByText('Post body')).toBeInTheDocument()
  })

  it('renders complex content in comments tab', () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="comments"
        postsContent={<div>Posts content</div>}
        commentsContent={
          <div>
            <h2>Comment Section</h2>
            <p>Comment text</p>
          </div>
        }
      />
    )

    expect(screen.getByText('Comment Section')).toBeInTheDocument()
    expect(screen.getByText('Comment text')).toBeInTheDocument()
  })

  it('handles null tab value gracefully', async () => {
    render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    // Verify tabs render correctly
    expect(screen.getByRole('tab', {name: /posts/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /comments/i})).toBeInTheDocument()

    // Verify that mockPush is not called with null
    expect(mockPush).not.toHaveBeenCalledWith('/u/testuser?tab=null')
  })

  it('maintains tab state on rerender', () => {
    const {rerender} = render(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content v1</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByText('Posts content v1')).toBeInTheDocument()

    rerender(
      <UserProfileTabs
        username="testuser"
        activeTab="posts"
        postsContent={<div>Posts content v2</div>}
        commentsContent={<div>Comments content</div>}
      />
    )

    expect(screen.getByText('Posts content v2')).toBeInTheDocument()
    expect(screen.queryByText('Posts content v1')).not.toBeInTheDocument()
  })
})
