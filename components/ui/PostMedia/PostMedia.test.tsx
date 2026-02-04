import type {RedditPost} from '@/lib/types/reddit'
import * as mediaHelpers from '@/lib/utils/media-helpers'
import {render, screen} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {PostMedia} from './PostMedia'

// Mock hooks before importing component
vi.mock('@/lib/utils/media-helpers')

const basePost: RedditPost = {
  id: 'test123',
  name: 't3_test123',
  title: 'Test Post',
  author: 'testuser',
  subreddit: 'test',
  subreddit_name_prefixed: 'r/test',
  permalink: '/r/test/comments/test123/test_post/',
  created_utc: Date.now() / 1000,
  score: 100,
  num_comments: 42,
  thumbnail: '',
  url: 'https://reddit.com/r/test/comments/test123/',
  likes: null,
  saved: false,
  over_18: false,
  stickied: false,
  is_video: false,
  ups: 100,
  downs: 0
}

describe('PostMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mediaHelpers.extractGalleryItems).mockReturnValue(null)
    vi.mocked(mediaHelpers.getMediumImage).mockReturnValue(null)
    vi.mocked(mediaHelpers.decodeImageUrl).mockImplementation((url) => url)
    vi.mocked(mediaHelpers.isValidThumbnail).mockReturnValue(false)
  })

  describe('gallery rendering', () => {
    it('renders gallery with correct props when gallery items exist', () => {
      const galleryItems = [
        {
          id: 'item1',
          url: 'https://i.redd.it/image1.jpg',
          width: 800,
          height: 600,
          caption: undefined
        },
        {
          id: 'item2',
          url: 'https://i.redd.it/image2.jpg',
          width: 800,
          height: 600,
          caption: undefined
        }
      ]
      vi.mocked(mediaHelpers.extractGalleryItems).mockReturnValue(galleryItems)

      const {container} = render(<PostMedia post={basePost} />)

      // Gallery component should be rendered
      // eslint-disable-next-line testing-library/no-container
      const carousel = container.querySelector('.mantine-Carousel-root')
      expect(carousel).toBeInTheDocument()
    })

    it('does not render gallery when no items', () => {
      vi.mocked(mediaHelpers.extractGalleryItems).mockReturnValue(null)

      const {container} = render(<PostMedia post={basePost} />)

      // eslint-disable-next-line testing-library/no-container
      const carousel = container.querySelector('.mantine-Carousel-root')
      expect(carousel).not.toBeInTheDocument()
    })
  })

  describe('video rendering', () => {
    it('renders reddit video from preview', () => {
      const postWithVideo = {
        ...basePost,
        preview: {
          enabled: true,
          reddit_video_preview: {
            hls_url: 'https://v.redd.it/test.m3u8',
            fallback_url: 'https://v.redd.it/test.mp4',
            width: 640,
            height: 480,
            duration: 60
          },
          images: []
        }
      }

      const {container} = render(<PostMedia post={postWithVideo} />)

      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })

    it('renders reddit video from media', () => {
      const postWithVideo = {
        ...basePost,
        media: {
          reddit_video: {
            hls_url: 'https://v.redd.it/test.m3u8',
            fallback_url: 'https://v.redd.it/test.mp4',
            width: 640,
            height: 480,
            duration: 60
          }
        }
      }

      const {container} = render(<PostMedia post={postWithVideo} />)

      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })

    it('renders mp4 from variants', () => {
      const postWithMp4 = {
        ...basePost,
        preview: {
          enabled: true,
          images: [
            {
              source: {
                url: 'https://i.redd.it/test.jpg',
                width: 800,
                height: 600
              },
              resolutions: [],
              variants: {
                mp4: {
                  source: {
                    url: 'https://v.redd.it/test.mp4',
                    width: 640,
                    height: 480
                  },
                  resolutions: []
                }
              }
            }
          ]
        }
      }

      const {container} = render(<PostMedia post={postWithMp4} />)

      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })

    it('renders external video when is_video is true', () => {
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue(null)

      const postWithExternalVideo = {
        ...basePost,
        is_video: true,
        url: 'https://v.redd.it/video.mp4'
      }

      const {container} = render(<PostMedia post={postWithExternalVideo} />)

      // eslint-disable-next-line testing-library/no-container
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })
  })

  describe('image rendering', () => {
    it('renders medium image with link', () => {
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue({
        url: 'https://preview.redd.it/test.jpg',
        width: 640,
        height: 480
      })

      const postWithImage = {
        ...basePost,
        url: 'https://example.com/image',
        preview: {
          enabled: true,
          images: [
            {
              source: {
                url: 'https://i.redd.it/test.jpg',
                width: 800,
                height: 600
              },
              resolutions: [],
              variants: {}
            }
          ]
        }
      }

      render(<PostMedia post={postWithImage} />)

      const img = screen.getByRole('img', {name: 'Test Post'})
      expect(img).toBeInTheDocument()
    })

    it('renders image without link when URL is invalid', () => {
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue({
        url: 'https://preview.redd.it/test.jpg',
        width: 640,
        height: 480
      })

      const postWithImage = {
        ...basePost,
        url: 'self.test',
        preview: {
          enabled: true,
          images: [
            {
              source: {
                url: 'https://i.redd.it/test.jpg',
                width: 800,
                height: 600
              },
              resolutions: [],
              variants: {}
            }
          ]
        }
      }

      const {container} = render(<PostMedia post={postWithImage} />)

      const img = screen.getByRole('img', {name: 'Test Post'})
      expect(img).toBeInTheDocument()

      // Should not be wrapped in link
      // eslint-disable-next-line testing-library/no-container
      const link = container.querySelector('a')
      expect(link).not.toBeInTheDocument()
    })

    it('calculates aspect ratio from source dimensions', () => {
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue({
        url: 'https://preview.redd.it/test.jpg',
        width: 1600,
        height: 900
      })

      const postWithImage = {
        ...basePost,
        url: 'https://example.com/image',
        preview: {
          enabled: true,
          images: [
            {
              source: {
                url: 'https://i.redd.it/test.jpg',
                width: 1600,
                height: 900
              },
              resolutions: [],
              variants: {}
            }
          ]
        }
      }

      const {container} = render(<PostMedia post={postWithImage} />)

      // eslint-disable-next-line testing-library/no-container
      const imageContainer = container.querySelector('[style*="aspect-ratio"]')
      expect(imageContainer).toBeInTheDocument()
    })

    it('uses default aspect ratio when dimensions missing', () => {
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue({
        url: 'https://preview.redd.it/test.jpg',
        width: 640,
        height: 360
      })

      const postWithImage = {
        ...basePost,
        url: 'https://example.com/image'
      }

      render(<PostMedia post={postWithImage} />)

      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })
  })

  describe('thumbnail rendering', () => {
    it('renders thumbnail when available', () => {
      const postWithThumbnail = {
        ...basePost,
        thumbnail: 'https://b.thumbs.redditmedia.com/test.jpg'
      }

      vi.mocked(mediaHelpers.isValidThumbnail).mockReturnValue(true)

      render(<PostMedia post={postWithThumbnail} />)

      const img = screen.getByRole('img', {name: 'Test Post'})
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', expect.stringContaining('test.jpg'))
    })

    it('does not render self thumbnail', () => {
      const postWithSelfThumbnail = {
        ...basePost,
        thumbnail: 'self'
      }

      const {container} = render(<PostMedia post={postWithSelfThumbnail} />)

      // eslint-disable-next-line testing-library/no-container
      const img = container.querySelector('img')
      expect(img).not.toBeInTheDocument()
    })

    it('does not render default thumbnail', () => {
      const postWithDefaultThumbnail = {
        ...basePost,
        thumbnail: 'default'
      }

      const {container} = render(<PostMedia post={postWithDefaultThumbnail} />)

      // eslint-disable-next-line testing-library/no-container
      const img = container.querySelector('img')
      expect(img).not.toBeInTheDocument()
    })

    it('does not render invalid thumbnail URL', () => {
      const postWithInvalidThumbnail = {
        ...basePost,
        thumbnail: 'not-a-url'
      }

      const {container} = render(<PostMedia post={postWithInvalidThumbnail} />)

      // eslint-disable-next-line testing-library/no-container
      const img = container.querySelector('img')
      expect(img).not.toBeInTheDocument()
    })
  })

  describe('no media', () => {
    it('renders nothing when no media available', () => {
      vi.mocked(mediaHelpers.extractGalleryItems).mockReturnValue(null)
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue(null)

      render(<PostMedia post={basePost} />)

      // Component returns null, nothing should be rendered
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
  })

  describe('priority rendering', () => {
    it('prioritizes gallery over video', () => {
      const galleryItems = [
        {
          id: 'item1',
          url: 'https://i.redd.it/image1.jpg',
          width: 800,
          height: 600,
          caption: undefined
        }
      ]
      vi.mocked(mediaHelpers.extractGalleryItems).mockReturnValue(galleryItems)

      const postWithBoth = {
        ...basePost,
        preview: {
          enabled: true,
          reddit_video_preview: {
            hls_url: 'https://v.redd.it/test.m3u8',
            fallback_url: 'https://v.redd.it/test.mp4',
            width: 640,
            height: 480,
            duration: 60
          },
          images: []
        }
      }

      render(<PostMedia post={postWithBoth} />)

      // Should render gallery (has images), not video
      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(
        screen.queryByRole('img', {name: /play video/i})
      ).not.toBeInTheDocument()
    })

    it('prioritizes video over image', () => {
      vi.mocked(mediaHelpers.getMediumImage).mockReturnValue({
        url: 'https://preview.redd.it/test.jpg',
        width: 640,
        height: 480
      })

      const postWithBoth = {
        ...basePost,
        url: 'https://example.com/image',
        preview: {
          enabled: true,
          reddit_video_preview: {
            hls_url: 'https://v.redd.it/test.m3u8',
            fallback_url: 'https://v.redd.it/test.mp4',
            width: 640,
            height: 480,
            duration: 60
          },
          images: [
            {
              source: {
                url: 'https://i.redd.it/test.jpg',
                width: 800,
                height: 600
              },
              resolutions: [],
              variants: {}
            }
          ]
        }
      }

      const {container} = render(<PostMedia post={postWithBoth} />)

      // Should render video, not image
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('video')).toBeInTheDocument()
      // eslint-disable-next-line testing-library/no-container
      expect(container.querySelector('img')).not.toBeInTheDocument()
    })
  })
})
