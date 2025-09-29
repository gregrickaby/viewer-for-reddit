import {PostCard} from '@/components/PostCard/PostCard'
import {render, screen} from '@/test-utils'

vi.mock('@/components/Media/Media', () => ({
  Media: () => <div data-testid="media" />
}))

vi.mock('@/lib/utils/formatTimeAgo', () => ({
  formatTimeAgo: () => 'just now'
}))

vi.mock('@/lib/utils/getMediumImage', () => ({
  getMediumImage: () => ({url: 'image.jpg'})
}))

describe('PostCard', () => {
  it('should render post information', () => {
    const post: any = {
      id: '1',
      subreddit_name_prefixed: 'r/test',
      created_utc: 123,
      permalink: '/r/test/1',
      title: 'Test post',
      preview: {images: [{resolutions: []}]},
      ups: 10,
      num_comments: 2
    }

    render(<PostCard post={post} />)
    expect(
      screen.getByRole('heading', {level: 2, name: 'Test post'})
    ).toBeInTheDocument()
    expect(screen.getByText(/r\/test/)).toBeInTheDocument()

    const time = screen.getByText('just now')
    expect(time).toBeInTheDocument()
    expect(time).toHaveAttribute(
      'dateTime',
      new Date(post.created_utc * 1000).toISOString()
    )
  })

  it('should render empty time when created_utc is missing', () => {
    const post: any = {
      id: '1',
      subreddit_name_prefixed: 'r/test',
      permalink: '/r/test/1',
      title: 'Test post',
      preview: {images: [{resolutions: []}]},
      ups: 10,
      num_comments: 2
    }

    render(<PostCard post={post} />)

    const time = screen.getByText((_, element) => element?.tagName === 'TIME')
    expect(time).toBeInTheDocument()
    expect(time).toHaveAttribute('dateTime', '')
  })

  it('should use internal routing by default', () => {
    const post: any = {
      id: 'abc123',
      subreddit_name_prefixed: 'r/programming',
      permalink: '/r/programming/comments/abc123/title/',
      title: 'Test post',
      preview: {images: [{resolutions: []}]},
      ups: 10,
      num_comments: 2
    }

    render(<PostCard post={post} />)

    const titleLink = screen.getByRole('heading', {level: 2}).closest('a')
    expect(titleLink).toHaveAttribute('href', '/r/programming/comments/abc123')
  })

  it('should use external Reddit links when useInternalRouting is false', () => {
    const post: any = {
      id: 'abc123',
      subreddit_name_prefixed: 'r/programming',
      permalink: '/r/programming/comments/abc123/title/',
      title: 'Test post',
      preview: {images: [{resolutions: []}]},
      ups: 10,
      num_comments: 2
    }

    render(<PostCard post={post} useInternalRouting={false} />)

    const titleLink = screen.getByRole('heading', {level: 2}).closest('a')
    expect(titleLink).toHaveAttribute(
      'href',
      'https://reddit.com/r/programming/comments/abc123/title/'
    )
    expect(titleLink).toHaveAttribute('target', '_blank')
  })
})
