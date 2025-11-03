import {Media} from '@/components/UI/Post/Media/Media'
import {logError} from '@/lib/utils/logging/logError'
import {render, screen} from '@/test-utils'

const {
  mockUseMediaType,
  mockUseMediaAssets,
  mockUseAppSelector,
  mockGetIsVertical,
  mockUseGalleryData
} = vi.hoisted(() => ({
  mockUseMediaType: vi.fn(),
  mockUseMediaAssets: vi.fn(),
  mockUseAppSelector: vi.fn(),
  mockGetIsVertical: vi.fn(),
  mockUseGalleryData: vi.fn()
}))

vi.mock('@/lib/hooks/media/useMediaType', () => ({
  useMediaType: mockUseMediaType
}))

vi.mock('@/lib/hooks/media/useMediaAssets', () => ({
  useMediaAssets: mockUseMediaAssets
}))

vi.mock('@/lib/hooks/media/useGalleryData', () => ({
  useGalleryData: mockUseGalleryData
}))

vi.mock('@/lib/store/hooks', () => ({
  useAppSelector: mockUseAppSelector
}))

vi.mock('@/lib/utils/formatting/getIsVertical', () => ({
  getIsVertical: mockGetIsVertical
}))

vi.mock('@/lib/utils/logging/logError', () => ({
  logError: vi.fn()
}))

vi.mock('@/components/UI/Post/Media/ResponsiveImage/ResponsiveImage', () => ({
  ResponsiveImage: (props: any) => (
    <div data-testid="responsive-image" {...props} />
  )
}))

vi.mock('@/components/UI/Post/Media/HlsPlayer/HlsPlayer', () => ({
  HlsPlayer: ({muted, dataHint, fallbackUrl, ...props}: any) => (
    <div
      data-testid="hls-player"
      data-hint={dataHint}
      data-muted={String(muted)}
      {...props}
    />
  )
}))

vi.mock('@/components/UI/Post/Media/YouTubePlayer/YouTubePlayer', () => ({
  YouTubePlayer: ({videoId, ...props}: any) => (
    <div data-testid="youtube-player" {...props} />
  )
}))

vi.mock('@/components/UI/Post/Media/Gallery/Gallery', () => ({
  Gallery: ({items, title}: any) => (
    <div data-testid="gallery" data-title={title} data-items={items.length} />
  )
}))

const createMediaTypeMock = (
  overrides: Partial<
    ReturnType<typeof import('@/lib/hooks/media/useMediaType').useMediaType>
  > = {}
) => ({
  isImage: false,
  isLink: false,
  isRedditVideo: false,
  isYouTube: false,
  isLinkWithVideo: false,
  isGifv: false,
  isVideoFile: false,
  youtubeVideoId: null,
  ...overrides
})

describe('Media', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAppSelector.mockReturnValue(true)
    mockUseMediaAssets.mockReturnValue({mediumImage: null, fallbackUrl: null})
    mockUseGalleryData.mockReturnValue(null)
    mockGetIsVertical.mockReturnValue(false)
  })

  it('should render YouTube when post is YouTube', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({
        isYouTube: true,
        youtubeVideoId: 'abc'
      })
    )

    const post: any = {id: '1'}
    render(<Media {...post} />)
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument()
  })

  it('should render image when post is an image', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({
        isImage: true
      })
    )

    const post: any = {
      title: 'test',
      url: 'image.jpg',
      preview: {images: [{source: {width: 1, height: 1}}]}
    }
    render(<Media {...post} />)
    expect(screen.getByTestId('responsive-image')).toBeInTheDocument()
  })

  it('should render reddit video when post is reddit video', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({
        isRedditVideo: true
      })
    )

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

  it('should use media reddit video when preview missing', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({
        isRedditVideo: true
      })
    )

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

  it('should render link gifv when fallbackUrl present', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({
        isLink: true,
        isLinkWithVideo: true
      })
    )
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
      'data-hint',
      'link:gifv'
    )
  })

  it('should render selftext when provided', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock())
    const post: any = {
      selftext: 'hello',
      selftext_html: '<p>hello</p>',
      post_hint: 'self'
    }
    render(<Media {...post} />)
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(logError).not.toHaveBeenCalled()
  })

  it('should handle missing selftext_html', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock())
    const post: any = {selftext: 'hello', post_hint: 'self'}
    render(<Media {...post} />)
    expect(logError).not.toHaveBeenCalled()
  })

  it('should render unsupported message when no selftext', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({
        isYouTube: true
      })
    )
    const post: any = {selftext: '', post_hint: 'other', url: 'test-url'}
    render(<Media {...post} />)
    expect(screen.getByText('Unsupported post type')).toBeInTheDocument()
    expect(logError).toHaveBeenCalled()
  })

  it('should render gallery when post has gallery items', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isGallery: true}))
    mockUseGalleryData.mockReturnValue([{url: 'img1.jpg'}, {url: 'img2.jpg'}])

    const post: any = {title: 'My Gallery', id: '1'}
    render(<Media {...post} />)

    const gallery = screen.getByTestId('gallery')
    expect(gallery).toBeInTheDocument()
    expect(gallery).toHaveAttribute('data-title', 'My Gallery')
    expect(gallery).toHaveAttribute('data-items', '2')
  })

  it('should render gallery with default title when title is missing', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isGallery: true}))
    mockUseGalleryData.mockReturnValue([{url: 'img1.jpg'}])

    const post: any = {id: '1'}
    render(<Media {...post} />)

    const gallery = screen.getByTestId('gallery')
    expect(gallery).toHaveAttribute('data-title', 'Gallery')
  })

  it('should handle empty gallery items gracefully', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isGallery: true}))
    mockUseGalleryData.mockReturnValue([])

    const post: any = {title: 'Empty', id: '1'}
    render(<Media {...post} />)

    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument()
  })

  it('should handle null gallery items', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isGallery: true}))
    mockUseGalleryData.mockReturnValue(null)

    const post: any = {title: 'Null', id: '1'}
    render(<Media {...post} />)

    expect(screen.queryByTestId('gallery')).not.toBeInTheDocument()
  })

  it('should render vertical images with vertical class', () => {
    mockGetIsVertical.mockReturnValue(true)
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isImage: true}))

    const post: any = {
      title: 'Tall',
      url: 'vertical.jpg',
      preview: {images: [{source: {width: 100, height: 200}}]}
    }
    render(<Media {...post} />)

    const container = screen.getByTestId('responsive-image').parentElement
    expect(container?.className).toMatch(/vertical/)
  })

  it('should render horizontal images without vertical class', () => {
    mockGetIsVertical.mockReturnValue(false)
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isImage: true}))

    const post: any = {
      title: 'Wide',
      url: 'wide.jpg',
      preview: {images: [{source: {width: 200, height: 100}}]}
    }
    render(<Media {...post} />)

    const container = screen.getByTestId('responsive-image').parentElement
    expect(container?.className).not.toMatch(/vertical/)
  })

  it('should render vertical reddit video with vertical class', () => {
    mockGetIsVertical.mockReturnValue(true)
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isRedditVideo: true}))

    const post: any = {
      id: '1',
      preview: {
        reddit_video_preview: {
          width: 100,
          height: 200,
          fallback_url: 'f',
          hls_url: 'h'
        }
      }
    }
    render(<Media {...post} />)

    const container = screen.getByTestId('hls-player').parentElement
    expect(container?.className).toMatch(/vertical/)
  })

  it('should render link video with vertical class when vertical', () => {
    mockGetIsVertical.mockReturnValue(true)
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({isLink: true, isLinkWithVideo: true})
    )
    mockUseMediaAssets.mockReturnValue({
      mediumImage: {url: 'm'},
      fallbackUrl: 'gifv.mp4'
    })

    const post: any = {
      id: '1',
      video_preview: {width: 100, height: 200, hls_url: 'h'}
    }
    render(<Media {...post} />)

    const container = screen.getByTestId('hls-player').parentElement
    expect(container?.className).toMatch(/vertical/)
  })

  it('should render link image when link has no video', () => {
    mockGetIsVertical.mockReturnValue(false)
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({isLink: true, isLinkWithVideo: false})
    )
    mockUseMediaAssets.mockReturnValue({
      mediumImage: {url: 'medium.jpg'},
      fallbackUrl: null
    })

    const post: any = {
      title: 'Link',
      thumbnail: 'thumb.jpg',
      preview: {images: [{source: {width: 100, height: 100}}]}
    }
    render(<Media {...post} />)

    expect(screen.getByTestId('responsive-image')).toBeInTheDocument()
  })

  it('should use thumbnail when medium image is not available', () => {
    mockGetIsVertical.mockReturnValue(false)
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({isLink: true, isLinkWithVideo: false})
    )
    mockUseMediaAssets.mockReturnValue({
      mediumImage: undefined,
      fallbackUrl: null
    })

    const post: any = {
      title: 'Link',
      thumbnail: 'thumb.jpg',
      preview: {images: [{source: {width: 100, height: 100}}]}
    }
    render(<Media {...post} />)

    expect(screen.getByTestId('responsive-image')).toBeInTheDocument()
  })

  it('should handle missing preview data for images', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isImage: true}))

    const post: any = {title: 'No Preview', url: 'img.jpg'}
    render(<Media {...post} />)

    // Component renders with undefined src - ResponsiveImage handles it
    const img = screen.getByTestId('responsive-image')
    expect(img).toBeInTheDocument()
  })

  it('should handle missing video data for reddit video', () => {
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isRedditVideo: true}))

    const post: any = {id: '1', preview: undefined, media: undefined}
    render(<Media {...post} />)

    // Still renders HlsPlayer, just with undefined video data
    expect(screen.getByTestId('hls-player')).toBeInTheDocument()
  })

  it('should handle missing video preview for link video', () => {
    mockUseMediaType.mockReturnValue(
      createMediaTypeMock({isLink: true, isLinkWithVideo: true})
    )

    const post: any = {id: '1', video_preview: undefined}
    render(<Media {...post} />)

    // Still renders HlsPlayer, just with undefined video preview data
    expect(screen.getByTestId('hls-player')).toBeInTheDocument()
  })

  it('should pass muted state from settings to reddit video', () => {
    mockUseAppSelector.mockReturnValue(false)
    mockUseMediaType.mockReturnValue(createMediaTypeMock({isRedditVideo: true}))

    const post: any = {
      id: '1',
      preview: {
        reddit_video_preview: {
          width: 100,
          height: 100,
          fallback_url: 'f',
          hls_url: 'h'
        }
      }
    }
    render(<Media {...post} />)

    const player = screen.getByTestId('hls-player')
    expect(player).toHaveAttribute('data-muted', 'false')
  })
})
