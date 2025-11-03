import {Card} from '@/components/UI/Post/Card/Card'
import {render, screen} from '@/test-utils'

vi.mock('@/components/Media/Media', () => ({
  Media: () => <div data-testid="media" />
}))

vi.mock('@/lib/utils/formatting/posts/formatTimeAgo', () => ({
  formatTimeAgo: () => 'just now'
}))

vi.mock('@/lib/utils/formatting/media/getMediumImage', () => ({
  getMediumImage: () => ({url: 'image.jpg'})
}))

describe('Card', () => {
  const defaultPost: any = {
    id: '1',
    subreddit_name_prefixed: 'r/test',
    created_utc: 123,
    permalink: '/r/test/1',
    title: 'Test post',
    preview: {images: [{resolutions: []}]},
    ups: 10,
    num_comments: 2
  }

  it('should render post information', () => {
    render(<Card post={defaultPost} />)
    expect(
      screen.getByRole('heading', {level: 2, name: 'Test post'})
    ).toBeInTheDocument()
    expect(screen.getByText(/r\/test/)).toBeInTheDocument()

    const time = screen.getByText('just now')
    expect(time).toBeInTheDocument()
    expect(time).toHaveAttribute(
      'dateTime',
      new Date(defaultPost.created_utc * 1000).toISOString()
    )
  })

  it('should render empty time when created_utc is missing', () => {
    const post = {
      ...defaultPost,
      created_utc: undefined
    }

    render(<Card post={post} />)

    const time = screen.getByText((_, element) => element?.tagName === 'TIME')
    expect(time).toBeInTheDocument()
    expect(time).toHaveAttribute('dateTime', '')
  })

  it('should use internal routing by default', () => {
    const post = {
      ...defaultPost,
      id: 'abc123',
      subreddit_name_prefixed: 'r/programming',
      permalink: '/r/programming/comments/abc123/title/'
    }

    render(<Card post={post} />)

    const titleLink = screen.getByRole('heading', {level: 2}).closest('a')
    expect(titleLink).toHaveAttribute(
      'href',
      '/r/programming/comments/abc123/title'
    )
  })

  it('should use external Reddit links when useInternalRouting is false', () => {
    const post = {
      ...defaultPost,
      id: 'abc123',
      subreddit_name_prefixed: 'r/programming',
      permalink: '/r/programming/comments/abc123/title/'
    }

    render(<Card post={post} useInternalRouting={false} />)

    const titleLink = screen.getByRole('heading', {level: 2}).closest('a')
    expect(titleLink).toHaveAttribute(
      'href',
      'https://reddit.com/r/programming/comments/abc123/title/'
    )
    expect(titleLink).toHaveAttribute('target', '_blank')
  })

  it('should display upvotes in a Badge component in the upper meta area', () => {
    const post = {
      ...defaultPost,
      author: 'testuser',
      ups: 42
    }

    render(<Card post={post} />)

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeVisible()
  })

  it('should pass postLink to CardActions for navigation', () => {
    const post = {
      ...defaultPost,
      permalink: '/r/programming/comments/abc123/title/'
    }

    render(<Card post={post} />)

    // CardActions should render a link to the post with #comments hash
    const commentsLink = screen.getByRole('link', {
      name: /2 comments/i
    })

    expect(commentsLink).toBeInTheDocument()
    expect(commentsLink).toHaveAttribute(
      'href',
      '/r/programming/comments/abc123/title#comments'
    )
  })
})
