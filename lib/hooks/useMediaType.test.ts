import {renderHook} from '@/test-utils'
import {useMediaType} from './useMediaType'

describe('useMediaType', () => {
  it('detects image post', () => {
    const post = {post_hint: 'image'} as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isImage).toBe(true)
    expect(result.current.isLink).toBe(false)
    expect(result.current.isRedditVideo).toBe(false)
    expect(result.current.isYouTube).toBe(false)
    expect(result.current.youtubeVideoId).toBe(null)
  })

  it('detects link post', () => {
    const post = {post_hint: 'link'} as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isImage).toBe(false)
    expect(result.current.isLink).toBe(true)
    expect(result.current.isRedditVideo).toBe(false)
    expect(result.current.isYouTube).toBe(false)
    expect(result.current.youtubeVideoId).toBe(null)
  })

  it('detects reddit hosted:video', () => {
    const post = {post_hint: 'hosted:video'} as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isRedditVideo).toBe(true)
    expect(result.current.isYouTube).toBe(false)
  })

  it('detects reddit rich:video', () => {
    const post = {post_hint: 'rich:video'} as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isRedditVideo).toBe(true)
    expect(result.current.isYouTube).toBe(false)
  })

  it('detects YouTube video and extracts videoId', () => {
    const post = {
      post_hint: 'rich:video',
      media: {
        oembed: {
          provider_name: 'YouTube',
          html: '<iframe src="https://www.youtube.com/embed/abc123xyz"></iframe>'
        }
      }
    } as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isYouTube).toBe(true)
    expect(result.current.youtubeVideoId).toBe('abc123xyz')
  })

  it('returns null youtubeVideoId if not YouTube', () => {
    const post = {
      post_hint: 'rich:video',
      media: {
        oembed: {
          provider_name: 'Vimeo',
          html: '<iframe src="https://vimeo.com/123"></iframe>'
        }
      }
    } as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isYouTube).toBe(false)
    expect(result.current.youtubeVideoId).toBe(null)
  })

  it('returns null youtubeVideoId if YouTube but no match', () => {
    const post = {
      post_hint: 'rich:video',
      media: {
        oembed: {
          provider_name: 'YouTube',
          html: '<iframe src="https://www.youtube.com/embed/"></iframe>'
        }
      }
    } as any
    const {result} = renderHook(() => useMediaType(post))
    expect(result.current.isYouTube).toBe(true)
    expect(result.current.youtubeVideoId).toBe(null)
  })
})
