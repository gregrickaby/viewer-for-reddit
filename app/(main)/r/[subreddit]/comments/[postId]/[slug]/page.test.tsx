import {appConfig} from '@/lib/config/app.config'
import {RedditPost} from '@/lib/types/reddit'
import {describe, expect, it, vi} from 'vitest'
import {generateMetadata} from './page'

// Mock dependencies
vi.mock('@/lib/actions/reddit', () => ({
  fetchPost: vi.fn()
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn()
}))

const {fetchPost} = await import('@/lib/actions/reddit')

describe('PostPage - generateMetadata', () => {
  const mockParams = {
    subreddit: 'Unexpected',
    postId: '1qod56q',
    slug: 'necessary_roughness'
  }

  const mockPost: RedditPost = {
    id: '1qod56q',
    name: 't3_1qod56q',
    title: 'Necessary Roughness',
    author: 'testuser',
    subreddit: 'Unexpected',
    subreddit_name_prefixed: 'r/Unexpected',
    created_utc: Date.now() / 1000 - 3600,
    score: 1337,
    num_comments: 42,
    over_18: false,
    permalink: '/r/Unexpected/comments/1qod56q/necessary_roughness',
    url: 'https://reddit.com/r/Unexpected/comments/1qod56q',
    thumbnail: '',
    is_video: false,
    stickied: false,
    ups: 1337,
    downs: 0,
    selftext: ''
  }

  it('generates metadata with actual post data', async () => {
    vi.mocked(fetchPost).mockResolvedValue({
      post: mockPost,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.title).toBe(
      `${mockPost.title} - r/${mockPost.subreddit} - ${appConfig.site.name}`
    )
    expect(metadata.description).toBe(
      `${mockPost.title} - Posted by u/${mockPost.author} in r/${mockPost.subreddit}`
    )
    expect(metadata.alternates?.canonical).toBe(
      `/r/${mockParams.subreddit}/comments/${mockParams.postId}/${mockParams.slug}`
    )
  })

  it('uses post selftext for description when available', async () => {
    const postWithSelftext = {
      ...mockPost,
      selftext:
        'This is a detailed post with a lot of content that should be truncated to 160 characters for the meta description tag to avoid being too long for search engines.'
    }

    vi.mocked(fetchPost).mockResolvedValue({
      post: postWithSelftext,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.description).toBe(postWithSelftext.selftext.slice(0, 160))
    expect(metadata.description?.length).toBeLessThanOrEqual(160)
  })

  it('uses thumbnail for OpenGraph image when available', async () => {
    const postWithThumbnail = {
      ...mockPost,
      thumbnail: 'https://b.thumbs.redditmedia.com/test-thumb.jpg'
    }

    vi.mocked(fetchPost).mockResolvedValue({
      post: postWithThumbnail,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.openGraph?.images).toEqual([
      {
        url: postWithThumbnail.thumbnail,
        width: 1200,
        height: 630,
        alt: postWithThumbnail.title
      }
    ])
  })

  it('uses preview image when thumbnail is default placeholder', async () => {
    const previewUrl = 'https://preview.redd.it/test-preview.jpg?width=640'
    const postWithPreview = {
      ...mockPost,
      thumbnail: 'default',
      preview: {
        images: [
          {
            source: {
              url: previewUrl,
              width: 640,
              height: 480
            },
            resolutions: [],
            id: 'test',
            variants: {}
          }
        ],
        enabled: true
      }
    }

    vi.mocked(fetchPost).mockResolvedValue({
      post: postWithPreview,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.openGraph?.images).toEqual([
      {
        url: previewUrl,
        width: 640,
        height: 480,
        alt: postWithPreview.title
      }
    ])
  })

  it('includes Twitter card metadata', async () => {
    vi.mocked(fetchPost).mockResolvedValue({
      post: mockPost,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.twitter).toEqual({
      card: 'summary_large_image',
      title: mockPost.title,
      description: `${mockPost.title} - Posted by u/${mockPost.author} in r/${mockPost.subreddit}`,
      images: ['/social-share.webp']
    })
  })

  it('falls back to default image when no thumbnail or preview', async () => {
    const postWithoutImages = {
      ...mockPost,
      thumbnail: 'self',
      preview: undefined
    }

    vi.mocked(fetchPost).mockResolvedValue({
      post: postWithoutImages,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.openGraph?.images).toEqual([
      {
        url: '/social-share.webp',
        width: 1200,
        height: 630,
        alt: postWithoutImages.title
      }
    ])
  })

  it('ignores NSFW thumbnail placeholders', async () => {
    const postWithNSFW = {
      ...mockPost,
      thumbnail: 'nsfw',
      preview: undefined
    }

    vi.mocked(fetchPost).mockResolvedValue({
      post: postWithNSFW,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.openGraph?.images).toEqual([
      {
        url: '/social-share.webp',
        width: 1200,
        height: 630,
        alt: postWithNSFW.title
      }
    ])
  })

  it('ignores spoiler thumbnail placeholders', async () => {
    const postWithSpoiler = {
      ...mockPost,
      thumbnail: 'spoiler',
      preview: undefined
    }

    vi.mocked(fetchPost).mockResolvedValue({
      post: postWithSpoiler,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.openGraph?.images).toEqual([
      {
        url: '/social-share.webp',
        width: 1200,
        height: 630,
        alt: postWithSpoiler.title
      }
    ])
  })

  it('sets robots to no-index but follow', async () => {
    vi.mocked(fetchPost).mockResolvedValue({
      post: mockPost,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.robots).toEqual({
      index: false,
      follow: true
    })
  })

  it('includes site name in OpenGraph', async () => {
    vi.mocked(fetchPost).mockResolvedValue({
      post: mockPost,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    expect(metadata.openGraph?.siteName).toBe(appConfig.site.name)
  })

  it('includes article metadata', async () => {
    vi.mocked(fetchPost).mockResolvedValue({
      post: mockPost,
      comments: []
    })

    const metadata = await generateMetadata({
      params: Promise.resolve(mockParams),
      searchParams: Promise.resolve({})
    })

    // Verify that article-specific metadata is present
    expect(metadata.title).toContain(mockPost.title)
    expect(metadata.openGraph?.title).toBe(mockPost.title)
    expect(metadata.twitter?.title).toBe(mockPost.title)
  })
})
