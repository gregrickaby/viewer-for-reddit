import {Media} from '@/components/Media/Media'
import {render, screen} from '@/test-utils'

vi.mock('@/lib/hooks/useMediaType', () => ({
  useMediaType: () => ({
    isImage: true,
    isLink: false,
    isRedditVideo: false,
    isYouTube: false,
    youtubeVideoId: null
  })
}))

vi.mock('@/lib/hooks/useMediaAssets', () => ({
  useMediaAssets: () => ({mediumImage: null, fallbackUrl: null})
}))

vi.mock('@/lib/store/hooks', () => ({
  useAppSelector: () => true
}))

vi.mock('@/lib/utils/getIsVertical', () => ({
  getIsVertical: () => false
}))

vi.mock('@/components/ResponsiveImage/ResponsiveImage', () => ({
  ResponsiveImage: () => <div data-testid="responsive-image" />
}))

describe('Media', () => {
  it('renders image when post is an image', () => {
    const post: any = {
      title: 'test',
      url: 'image.jpg',
      preview: {images: [{source: {width: 1, height: 1}}]}
    }
    render(<Media {...post} />)
    expect(screen.getByTestId('responsive-image')).toBeInTheDocument()
  })
})
