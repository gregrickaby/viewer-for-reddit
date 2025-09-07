import {Media} from '@/components/Media/Media'
import {render, screen} from '@/test-utils'

const {mockUseMediaType, mockUseMediaAssets, mockUseAppSelector} = vi.hoisted(
  () => ({
    mockUseMediaType: vi.fn(),
    mockUseMediaAssets: vi.fn(),
    mockUseAppSelector: vi.fn()
  })
)

vi.mock('@/lib/hooks/useMediaType', () => ({
  useMediaType: mockUseMediaType
}))

vi.mock('@/lib/hooks/useMediaAssets', () => ({
  useMediaAssets: mockUseMediaAssets
}))

vi.mock('@/lib/store/hooks', () => ({
  useAppSelector: mockUseAppSelector
}))

vi.mock('@/lib/utils/getIsVertical', () => ({
  getIsVertical: () => false
}))

vi.mock('@/components/ResponsiveImage/ResponsiveImage', () => ({
  ResponsiveImage: (props: any) => (
    <div data-testid="responsive-image" {...props} />
  )
}))

vi.mock('@/components/HlsPlayer/HlsPlayer', () => ({
  HlsPlayer: (props: any) => <div data-testid="hls-player" {...props} />
}))

vi.mock('@/components/YouTubePlayer/YouTubePlayer', () => ({
  YouTubePlayer: (props: any) => <div data-testid="youtube-player" {...props} />
}))

vi.mock('@/components/MediaContainer/MediaContainer', () => ({
  MediaContainer: ({children}: any) => (
    <div data-testid="media-container">{children}</div>
  )
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAppSelector.mockReturnValue(true)
  mockUseMediaAssets.mockReturnValue({mediumImage: null, fallbackUrl: null})
})

describe('Media', () => {
  it('renders YouTube when post is YouTube', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: false,
      isRedditVideo: false,
      isYouTube: true,
      youtubeVideoId: 'abc'
    })

    const post: any = {id: '1'}
    render(<Media {...post} />)
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument()
  })

  it('renders image when post is an image', () => {
    mockUseMediaType.mockReturnValue({
      isImage: true,
      isLink: false,
      isRedditVideo: false,
      isYouTube: false,
      youtubeVideoId: null
    })

    const post: any = {
      title: 'test',
      url: 'image.jpg',
      preview: {images: [{source: {width: 1, height: 1}}]}
    }
    render(<Media {...post} />)
    expect(screen.getByTestId('responsive-image')).toBeInTheDocument()
  })

  it('renders reddit video when post is reddit video', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: false,
      isRedditVideo: true,
      isYouTube: false,
      youtubeVideoId: null
    })

    const post: any = {
      id: '1',
      post_hint: 'hosted:video',
      preview: {
        reddit_video_preview: {
          width: 1,
          height: 1,
          fallback_url: 'f',
          hls_url: 'h'
        }
      },
      media: null
    }
    mockUseMediaAssets.mockReturnValue({
      mediumImage: {url: 'm'},
      fallbackUrl: null
    })
    render(<Media {...post} />)
    expect(screen.getByTestId('hls-player')).toBeInTheDocument()
  })

  it('uses media reddit video when preview missing', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: false,
      isRedditVideo: true,
      isYouTube: false,
      youtubeVideoId: null
    })

    const post: any = {
      id: '1',
      post_hint: 'hosted:video',
      media: {
        reddit_video: {width: 1, height: 1, fallback_url: 'f', hls_url: 'h'}
      },
      preview: undefined
    }
    mockUseMediaAssets.mockReturnValue({
      mediumImage: {url: 'm'},
      fallbackUrl: null
    })
    render(<Media {...post} />)
    expect(screen.getByTestId('hls-player')).toBeInTheDocument()
  })

  it('renders link gifv when fallbackUrl present', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: true,
      isRedditVideo: false,
      isYouTube: false,
      youtubeVideoId: null
    })
    mockUseMediaAssets.mockReturnValue({
      mediumImage: {url: 'm'},
      fallbackUrl: 'gifv.mp4'
    })

    const post: any = {
      id: '1',
      post_hint: 'link',
      title: 'test',
      video_preview: {width: 1, height: 1, hls_url: 'h'}
    }
    render(<Media {...post} />)
    expect(screen.getByTestId('hls-player')).toHaveAttribute(
      'dataHint',
      'link:gifv'
    )
  })

  it('renders link when no fallbackUrl', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: true,
      isRedditVideo: false,
      isYouTube: false,
      youtubeVideoId: null
    })
    mockUseMediaAssets.mockReturnValue({
      mediumImage: {url: 'm'},
      fallbackUrl: null
    })

    const post: any = {
      id: '1',
      post_hint: 'link',
      title: 'test',
      video_preview: {width: 1, height: 1, hls_url: 'h'}
    }
    render(<Media {...post} />)
    expect(screen.getByTestId('hls-player')).toHaveAttribute('dataHint', 'link')
  })

  it('renders selftext when provided', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: false,
      isRedditVideo: false,
      isYouTube: false,
      youtubeVideoId: null
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const post: any = {
      selftext: 'hello',
      selftext_html: '<p>hello</p>',
      post_hint: 'self'
    }
    render(<Media {...post} />)
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(warn).toHaveBeenCalled()
  })

  it('handles missing selftext_html', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: false,
      isRedditVideo: false,
      isYouTube: false,
      youtubeVideoId: null
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const post: any = {selftext: 'hello', post_hint: 'self'}
    render(<Media {...post} />)
    expect(warn).toHaveBeenCalled()
  })

  it('renders unsupported message when no selftext', () => {
    mockUseMediaType.mockReturnValue({
      isImage: false,
      isLink: false,
      isRedditVideo: false,
      isYouTube: true,
      youtubeVideoId: null
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const post: any = {selftext: '', post_hint: 'other'}
    render(<Media {...post} />)
    expect(screen.getByText('Unsupported media.')).toBeInTheDocument()
    expect(warn).toHaveBeenCalled()
  })
})
