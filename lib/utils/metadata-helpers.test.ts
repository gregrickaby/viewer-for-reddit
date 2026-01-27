import {appConfig} from '@/lib/config/app.config'
import {RedditPost} from '@/lib/types/reddit'
import {describe, expect, it} from 'vitest'
import {
  generateListingMetadata,
  generatePostMetadata,
  getPostImageMetadata
} from './metadata-helpers'

describe('metadata-helpers', () => {
  const mockPost: RedditPost = {
    id: 'abc123',
    name: 't3_abc123',
    title: 'Amazing Test Post',
    author: 'testuser',
    subreddit: 'programming',
    subreddit_name_prefixed: 'r/programming',
    created_utc: Date.now() / 1000,
    score: 42,
    num_comments: 10,
    over_18: false,
    permalink: '/r/programming/comments/abc123/amazing_test_post',
    url: 'https://example.com/article',
    thumbnail: '',
    is_video: false,
    stickied: false,
    ups: 42,
    downs: 0,
    selftext: ''
  }

  describe('getPostImageMetadata', () => {
    it('returns real thumbnail when available', () => {
      const post = {
        ...mockPost,
        thumbnail: 'https://b.thumbs.redditmedia.com/test.jpg'
      }

      const result = getPostImageMetadata(post)

      expect(result).toEqual({
        url: 'https://b.thumbs.redditmedia.com/test.jpg',
        width: 1200,
        height: 630
      })
    })

    it('ignores "default" placeholder thumbnail', () => {
      const post = {
        ...mockPost,
        thumbnail: 'default'
      }

      const result = getPostImageMetadata(post)

      expect(result).toEqual({
        url: '/social-share.webp',
        width: 1200,
        height: 630
      })
    })

    it('ignores "self" placeholder thumbnail', () => {
      const post = {
        ...mockPost,
        thumbnail: 'self'
      }

      const result = getPostImageMetadata(post)

      expect(result.url).toBe('/social-share.webp')
    })

    it('ignores "nsfw" placeholder thumbnail', () => {
      const post = {
        ...mockPost,
        thumbnail: 'nsfw'
      }

      const result = getPostImageMetadata(post)

      expect(result.url).toBe('/social-share.webp')
    })

    it('ignores "spoiler" placeholder thumbnail', () => {
      const post = {
        ...mockPost,
        thumbnail: 'spoiler'
      }

      const result = getPostImageMetadata(post)

      expect(result.url).toBe('/social-share.webp')
    })

    it('ignores empty string thumbnail', () => {
      const post = {
        ...mockPost,
        thumbnail: ''
      }

      const result = getPostImageMetadata(post)

      expect(result.url).toBe('/social-share.webp')
    })

    it('uses preview image when thumbnail is placeholder', () => {
      const previewUrl = 'https://preview.redd.it/test.jpg'
      const post = {
        ...mockPost,
        thumbnail: 'default',
        preview: {
          images: [
            {
              source: {
                url: previewUrl,
                width: 800,
                height: 600
              },
              resolutions: [],
              id: 'test',
              variants: {}
            }
          ],
          enabled: true
        }
      }

      const result = getPostImageMetadata(post)

      expect(result).toEqual({
        url: previewUrl,
        width: 800,
        height: 600
      })
    })

    it('uses default dimensions when thumbnail has no dimensions', () => {
      const post = {
        ...mockPost,
        thumbnail: 'https://b.thumbs.redditmedia.com/test.jpg'
      }

      const result = getPostImageMetadata(post)

      expect(result.width).toBe(1200)
      expect(result.height).toBe(630)
    })

    it('uses default dimensions when preview has no dimensions', () => {
      const post = {
        ...mockPost,
        thumbnail: 'default',
        preview: {
          images: [
            {
              source: {
                url: 'https://preview.redd.it/test.jpg',
                width: 0,
                height: 0
              },
              resolutions: [],
              variants: {}
            }
          ],
          enabled: true
        }
      }

      const result = getPostImageMetadata(post)

      expect(result.width).toBe(1200)
      expect(result.height).toBe(630)
    })

    it('returns fallback when no images available', () => {
      const post = {
        ...mockPost,
        thumbnail: '',
        preview: undefined
      }

      const result = getPostImageMetadata(post)

      expect(result).toEqual({
        url: '/social-share.webp',
        width: 1200,
        height: 630
      })
    })

    it('accepts custom fallback image', () => {
      const post = {
        ...mockPost,
        thumbnail: ''
      }
      const customFallback = '/custom-fallback.png'

      const result = getPostImageMetadata(post, customFallback)

      expect(result.url).toBe(customFallback)
    })
  })

  describe('generatePostMetadata', () => {
    const canonicalUrl = '/r/programming/comments/abc123/amazing_test_post'

    it('generates complete metadata with all fields', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.title).toBeTruthy()
      expect(metadata.description).toBeTruthy()
      expect(metadata.alternates?.canonical).toBe(canonicalUrl)
      expect(metadata.robots).toEqual({index: false, follow: true})
      expect(metadata.openGraph).toBeTruthy()
      expect(metadata.twitter).toBeTruthy()
    })

    it('includes subreddit and site name in title', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.title).toBe(
        `${mockPost.title} - r/${mockPost.subreddit} - ${appConfig.site.name}`
      )
    })

    it('uses selftext for description when available', () => {
      const post = {
        ...mockPost,
        selftext:
          'This is a long selftext that should be truncated to 160 characters maximum for SEO purposes and to fit within meta description best practices for search engines and social media platforms.'
      }

      const metadata = generatePostMetadata(post, canonicalUrl)

      expect(metadata.description).toBe(post.selftext.slice(0, 160))
      expect(metadata.description?.length).toBeLessThanOrEqual(160)
    })

    it('generates fallback description when no selftext', () => {
      const post = {
        ...mockPost,
        selftext: ''
      }

      const metadata = generatePostMetadata(post, canonicalUrl)

      expect(metadata.description).toBe(
        `${post.title} - Posted by u/${post.author} in r/${post.subreddit}`
      )
    })

    it('includes OpenGraph metadata', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.openGraph).toEqual({
        title: mockPost.title,
        description: expect.any(String),
        url: canonicalUrl,
        type: 'article',
        images: [
          {
            url: expect.any(String),
            width: expect.any(Number),
            height: expect.any(Number),
            alt: mockPost.title
          }
        ],
        siteName: appConfig.site.name
      })
    })

    it('includes Twitter Card metadata', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.twitter).toEqual({
        card: 'summary_large_image',
        title: mockPost.title,
        description: expect.any(String),
        images: [expect.any(String)]
      })
    })

    it('uses real post image when available', () => {
      const post = {
        ...mockPost,
        thumbnail: 'https://b.thumbs.redditmedia.com/test.jpg'
      }

      const metadata = generatePostMetadata(post, canonicalUrl)

      expect(metadata.openGraph?.images).toEqual([
        {
          url: 'https://b.thumbs.redditmedia.com/test.jpg',
          width: 1200,
          height: 630,
          alt: post.title
        }
      ])
      const images = metadata.twitter?.images
      expect(Array.isArray(images) ? images[0] : images).toBe(
        'https://b.thumbs.redditmedia.com/test.jpg'
      )
    })

    it('uses fallback image when no post images', () => {
      const post = {
        ...mockPost,
        thumbnail: ''
      }

      const metadata = generatePostMetadata(post, canonicalUrl)

      const ogImages = metadata.openGraph?.images
      if (
        Array.isArray(ogImages) &&
        ogImages[0] &&
        typeof ogImages[0] === 'object' &&
        'url' in ogImages[0]
      ) {
        expect(ogImages[0].url).toBe('/social-share.webp')
      }

      const twImages = metadata.twitter?.images
      expect(Array.isArray(twImages) ? twImages[0] : twImages).toBe(
        '/social-share.webp'
      )
    })

    it('sets robots to no-index but follow', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.robots).toEqual({
        index: false,
        follow: true
      })
    })

    it('sets proper OpenGraph structure', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.openGraph).toBeDefined()
      expect(metadata.openGraph?.title).toBe(mockPost.title)
      expect(metadata.openGraph?.url).toBe(canonicalUrl)
    })

    it('includes site name in OpenGraph', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.openGraph?.siteName).toBe(appConfig.site.name)
    })

    it('uses post title for OpenGraph title', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      expect(metadata.openGraph?.title).toBe(mockPost.title)
    })

    it('uses post title for image alt text', () => {
      const metadata = generatePostMetadata(mockPost, canonicalUrl)

      const images = metadata.openGraph?.images
      if (
        Array.isArray(images) &&
        images[0] &&
        typeof images[0] === 'object' &&
        'alt' in images[0]
      ) {
        expect(images[0].alt).toBe(mockPost.title)
      }
    })
  })
  describe('generateListingMetadata', () => {
    it('generates complete metadata with all required fields', () => {
      const metadata = generateListingMetadata({
        title: 'r/programming',
        description: 'Browse posts in r/programming',
        canonicalUrl: '/r/programming'
      })

      expect(metadata.title).toBe(`r/programming - ${appConfig.site.name}`)
      expect(metadata.description).toBe('Browse posts in r/programming')
      expect(metadata.alternates?.canonical).toBe('/r/programming')
      expect(metadata.robots).toEqual({index: false, follow: false})
      expect(metadata.openGraph).toBeTruthy()
      expect(metadata.twitter).toBeTruthy()
    })

    it('uses index: false by default', () => {
      const metadata = generateListingMetadata({
        title: 'Test Page',
        description: 'Test description',
        canonicalUrl: '/test'
      })

      expect(metadata.robots).toEqual({index: false, follow: false})
    })

    it('allows custom index setting', () => {
      const metadata = generateListingMetadata({
        title: 'Home',
        description: 'Homepage',
        canonicalUrl: '/',
        index: true
      })

      expect(metadata.robots).toEqual({index: true, follow: false})
    })

    it('allows custom follow setting', () => {
      const metadata = generateListingMetadata({
        title: 'Important Page',
        description: 'Page that should be followed',
        canonicalUrl: '/important',
        follow: true
      })

      expect(metadata.robots).toEqual({index: false, follow: true})
    })

    it('uses default follow: false when not specified', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test'
      })

      expect(metadata.robots).toEqual({index: false, follow: false})
    })

    it('uses default fallback image', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test'
      })

      const ogImages = metadata.openGraph?.images
      if (
        Array.isArray(ogImages) &&
        ogImages[0] &&
        typeof ogImages[0] === 'object' &&
        'url' in ogImages[0]
      ) {
        expect(ogImages[0].url).toBe('/social-share.webp')
      }
    })

    it('allows custom image URL', () => {
      const customImage = '/custom-image.jpg'
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test',
        imageUrl: customImage
      })

      const ogImages = metadata.openGraph?.images
      if (
        Array.isArray(ogImages) &&
        ogImages[0] &&
        typeof ogImages[0] === 'object' &&
        'url' in ogImages[0]
      ) {
        expect(ogImages[0].url).toBe(customImage)
      }
    })

    it('uses featured post image when provided', () => {
      const featuredPost = {
        ...mockPost,
        thumbnail: 'https://b.thumbs.redditmedia.com/featured.jpg'
      }

      const metadata = generateListingMetadata({
        title: 'r/programming',
        description: 'Browse posts',
        canonicalUrl: '/r/programming',
        featuredPost
      })

      const ogImages = metadata.openGraph?.images
      if (
        Array.isArray(ogImages) &&
        ogImages[0] &&
        typeof ogImages[0] === 'object' &&
        'url' in ogImages[0]
      ) {
        expect(ogImages[0].url).toBe(
          'https://b.thumbs.redditmedia.com/featured.jpg'
        )
      }
    })

    it('prefers featured post over custom imageUrl', () => {
      const featuredPost = {
        ...mockPost,
        thumbnail: 'https://b.thumbs.redditmedia.com/featured.jpg'
      }

      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test',
        imageUrl: '/custom.jpg',
        featuredPost
      })

      const ogImages = metadata.openGraph?.images
      if (
        Array.isArray(ogImages) &&
        ogImages[0] &&
        typeof ogImages[0] === 'object' &&
        'url' in ogImages[0]
      ) {
        expect(ogImages[0].url).toBe(
          'https://b.thumbs.redditmedia.com/featured.jpg'
        )
      }
    })

    it('uses website as default OpenGraph type', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test'
      })

      expect(metadata.openGraph).toBeDefined()
      expect(metadata.openGraph).toMatchObject({
        title: 'Test',
        description: 'Test',
        url: '/test',
        type: 'website'
      })
    })

    it('allows custom OpenGraph type', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test',
        ogType: 'article'
      })

      expect(metadata.openGraph).toBeDefined()
      expect(metadata.openGraph).toMatchObject({
        type: 'article'
      })
    })

    it('includes site name in OpenGraph', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test'
      })

      expect(metadata.openGraph?.siteName).toBe(appConfig.site.name)
    })

    it('generates Twitter Card metadata', () => {
      const metadata = generateListingMetadata({
        title: 'Test Page',
        description: 'Test description',
        canonicalUrl: '/test'
      })

      expect(metadata.twitter).toEqual({
        card: 'summary_large_image',
        title: 'Test Page',
        description: 'Test description',
        images: [expect.any(String)]
      })
    })

    it('uses title without site name for OpenGraph title', () => {
      const metadata = generateListingMetadata({
        title: 'r/programming',
        description: 'Browse posts',
        canonicalUrl: '/r/programming'
      })

      // OpenGraph title should NOT include site name
      expect(metadata.openGraph?.title).toBe('r/programming')
      // But page title should include it
      expect(metadata.title).toBe(`r/programming - ${appConfig.site.name}`)
    })

    it('uses correct image dimensions', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test'
      })

      const ogImages = metadata.openGraph?.images
      if (
        Array.isArray(ogImages) &&
        ogImages[0] &&
        typeof ogImages[0] === 'object' &&
        'width' in ogImages[0] &&
        'height' in ogImages[0]
      ) {
        expect(ogImages[0].width).toBe(1200)
        expect(ogImages[0].height).toBe(630)
      }
    })

    it('sets robots with defaults', () => {
      const metadata = generateListingMetadata({
        title: 'Test',
        description: 'Test',
        canonicalUrl: '/test'
      })

      expect(metadata.robots).toEqual({index: false, follow: false})
    })

    it('handles subreddit listing use case', () => {
      const metadata = generateListingMetadata({
        title: 'r/nextjs',
        description: `Browse posts in r/nextjs with ${appConfig.site.name}`,
        canonicalUrl: '/r/nextjs'
      })

      expect(metadata.title).toContain('r/nextjs')
      expect(metadata.alternates?.canonical).toBe('/r/nextjs')
      expect(metadata.robots).toEqual({index: false, follow: false})
    })

    it('handles search results use case', () => {
      const query = 'typescript'
      const metadata = generateListingMetadata({
        title: `Search: ${query}`,
        description: `Search results for "${query}" on Reddit`,
        canonicalUrl: `/search/${query}`
      })

      expect(metadata.title).toContain('Search: typescript')
      expect(metadata.description).toContain('typescript')
      expect(metadata.robots).toEqual({index: false, follow: false})
    })

    it('handles user profile use case', () => {
      const username = 'johndoe'
      const metadata = generateListingMetadata({
        title: `u/${username}`,
        description: `View u/${username} profile`,
        canonicalUrl: `/u/${username}`,
        index: false
      })

      expect(metadata.title).toContain('u/johndoe')
      expect(metadata.openGraph?.url).toBe('/u/johndoe')
    })
  })
})
