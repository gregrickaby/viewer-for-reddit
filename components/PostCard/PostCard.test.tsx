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
  it('renders post information', () => {
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
    expect(screen.getByRole('heading', {name: 'Test post'})).toBeInTheDocument()
    expect(screen.getByText(/r\/test/)).toBeInTheDocument()
    expect(screen.getByText('just now')).toBeInTheDocument()
  })
})
