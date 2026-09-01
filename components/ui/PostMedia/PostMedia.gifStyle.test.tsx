import type {RedditPost} from '@/lib/types/reddit'
import {render, screen} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'

// Isolated from PostMedia.test.tsx: mocks VideoPlayer (not media-helpers) to
// observe the `gifStyle` prop each render path passes through, using real
// URL-parsing logic.
vi.mock('@/components/ui/VideoPlayer/VideoPlayer', () => ({
  VideoPlayer: ({gifStyle}: {gifStyle?: boolean}) => (
    <div data-testid="video-player" data-gif-style={String(gifStyle)} />
  )
}))

import {PostMedia} from './PostMedia'

const basePost: RedditPost = {
  id: 'test123',
  name: 't3_test123',
  title: 'Test Post',
  author: 'testuser',
  subreddit: 'gifs',
  subreddit_name_prefixed: 'r/gifs',
  permalink: '/r/gifs/comments/test123/test_post/',
  created_utc: Date.now() / 1000,
  score: 100,
  num_comments: 42,
  thumbnail: '',
  url: 'https://example.com',
  likes: null,
  saved: false,
  over_18: false,
  stickied: false,
  is_video: false,
  ups: 100,
  downs: 0
}

describe('PostMedia gifStyle wiring', () => {
  it('renders gif-style for a Reddit-mirrored preview of an external link', () => {
    const post = {
      ...basePost,
      preview: {
        enabled: true,
        images: [],
        reddit_video_preview: {
          hls_url: 'https://v.redd.it/test.m3u8',
          fallback_url: 'https://v.redd.it/test.mp4',
          width: 640,
          height: 480,
          duration: 5
        }
      }
    }

    render(<PostMedia post={post} />)

    expect(screen.getByTestId('video-player')).toHaveAttribute(
      'data-gif-style',
      'true'
    )
  })

  it('keeps controls for a native Reddit-hosted video', () => {
    const post = {
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

    render(<PostMedia post={post} />)

    expect(screen.getByTestId('video-player')).toHaveAttribute(
      'data-gif-style',
      'false'
    )
  })

  it('renders gif-style for a Reddit-hosted animated GIF', () => {
    const post = {
      ...basePost,
      preview: {
        enabled: true,
        images: [
          {
            source: {
              url: 'https://i.redd.it/test.jpg',
              width: 480,
              height: 480
            },
            resolutions: [],
            variants: {
              mp4: {
                source: {
                  url: 'https://v.redd.it/test.mp4',
                  width: 480,
                  height: 480
                },
                resolutions: []
              }
            }
          }
        ]
      }
    }

    render(<PostMedia post={post} />)

    expect(screen.getByTestId('video-player')).toHaveAttribute(
      'data-gif-style',
      'true'
    )
  })

  it('renders gif-style for a Giphy link', () => {
    const post = {
      ...basePost,
      url: 'https://giphy.com/gifs/cat-funny-xT0xeJpnrWC4XWblEk'
    }

    render(<PostMedia post={post} />)

    expect(screen.getByTestId('video-player')).toHaveAttribute(
      'data-gif-style',
      'true'
    )
  })

  it('renders gif-style for an Imgur .gifv link', () => {
    const post = {
      ...basePost,
      url: 'https://i.imgur.com/abc123.gifv'
    }

    render(<PostMedia post={post} />)

    expect(screen.getByTestId('video-player')).toHaveAttribute(
      'data-gif-style',
      'true'
    )
  })
})
