import { describe, expect, it, vi } from 'vitest'
import { PostMedia, blurredOf } from '@/components/media/post-media'
import { RedditHtml } from '@/components/reddit-html'
import type { GalleryItem, PostMedia as Media } from '@/lib/view-models'
import { blurred, html, imageSet } from '@/tests/helpers/views'
import { renderServer } from '@/tests/helpers/render-server'

vi.mock('@/app/actions/settings', () => ({ setBlurNsfw: vi.fn() }))

const render = (media: Media, reveal: 'nsfw' | 'spoiler' | null = null) =>
  renderServer(<PostMedia media={media} title="Title" reveal={reveal} postId="abc" />)

const loop = { mp4: 'https://v.redd.it/a/DASH_480.mp4', width: 480, height: 270 }
const video = {
  hls: 'https://v.redd.it/a/HLSPlaylist.m3u8',
  mp4Fallback: 'https://v.redd.it/a/DASH_720.mp4',
  width: 1280,
  height: 720,
  durationSec: 30,
}

describe('PostMedia', () => {
  it('renders nothing for text posts', async () => {
    expect(await render({ type: 'none' })).toBe('')
  })

  it('renders a responsive, lazy image with its aspect ratio reserved', async () => {
    const out = await render({ type: 'image', image: imageSet() })
    expect(out).toContain('style="aspect-ratio:640 / 480"')
    expect(out).toContain('srcSet="https://preview.redd.it/a.jpg?width=320 320w')
    expect(out).toContain('loading="lazy"')
    expect(out).toContain('alt="Title"')
  })

  it('omits an empty srcset', async () => {
    expect(await render({ type: 'image', image: imageSet({ srcSet: '' }) })).not.toContain('srcSet')
  })

  it('loops animated media through AutoplayVideo, with a no-JS autoplaying copy', async () => {
    const out = await render({ type: 'animated', loop, gif: null, poster: imageSet() })
    // The scripted <video> gets its src only as it nears the viewport.
    expect(out).toMatch(
      /<video class="media scripted"[^>]*poster="https:\/\/i\.redd\.it\/a\.jpg"[^>]*muted=""[^>]*loop=""/,
    )
    expect(out).toContain('<noscript><video class="media" src="https://v.redd.it/a/DASH_480.mp4"')
  })

  it('falls back to the GIF, with a still for reduced motion', async () => {
    const gif = imageSet({ src: 'https://i.redd.it/a.gif' })
    const withPoster = await render({ type: 'animated', loop: null, gif, poster: imageSet() })
    expect(withPoster).toContain(
      '<source media="(prefers-reduced-motion: reduce)" srcSet="https://i.redd.it/a.jpg"/>',
    )
    expect(withPoster).toContain('src="https://i.redd.it/a.gif"')
    const bare = await render({ type: 'animated', loop: null, gif, poster: null })
    expect(bare).not.toContain('prefers-reduced-motion')
  })

  it('lists HLS before the MP4 so Safari plays audio without JavaScript', async () => {
    const out = await render({ type: 'video', video, poster: null })
    expect(out).toMatch(
      /HLSPlaylist\.m3u8" type="application\/vnd\.apple\.mpegurl".*DASH_720\.mp4" type="video\/mp4"/,
    )
    expect(out).toContain('preload="none"')
    const hlsOnly = await render({
      type: 'video',
      video: { ...video, mp4Fallback: null },
      poster: null,
    })
    expect(hlsOnly).not.toContain('video/mp4')
  })

  it('renders galleries as a labelled strip of slides', async () => {
    const items: GalleryItem[] = [
      {
        media: { type: 'image', image: imageSet() },
        caption: 'First',
        outboundUrl: 'https://www.example.com/a',
      },
      {
        media: { type: 'animated', loop, gif: null, poster: null },
        caption: null,
        outboundUrl: 'https://example.com/b',
      },
      { media: { type: 'video', video, poster: null }, caption: 'Clip', outboundUrl: null },
      {
        media: { type: 'image', image: imageSet({ srcSet: '' }) },
        caption: null,
        outboundUrl: null,
      },
    ]
    const out = await render({ type: 'gallery', items })
    expect(out).toContain('aria-label="Gallery, 4 items"')
    expect(out).toContain('aria-label="1 of 4"')
    expect(out).toContain('loading="eager"')
    expect(out).toContain('alt="First"')
    expect(out).toContain('alt="Title, image 4 of 4"')
    expect(out).toContain('First<!-- --> · <a href="https://www.example.com/a"')
    expect(out).toContain('example.com<!-- --> ↗')
    expect(out).toContain('<p class="caption">Clip</p>')
    // The frame's ratio is clamped to 4:5 … 16:9 from the first item.
    expect(out).toContain('aspect-ratio:1.3333333333333333')
  })

  it('clamps extreme gallery frames and sizes animated and video first items', async () => {
    const tall = await render({
      type: 'gallery',
      items: [
        {
          media: {
            type: 'animated',
            loop: null,
            gif: imageSet({ width: 100, height: 1000 }),
            poster: null,
          },
          caption: null,
          outboundUrl: null,
        },
        { media: { type: 'image', image: imageSet() }, caption: null, outboundUrl: null },
      ],
    })
    expect(tall).toContain('aspect-ratio:0.8')
    const wide = await render({
      type: 'gallery',
      items: [
        {
          media: { type: 'video', video: { ...video, width: 4000, height: 1000 }, poster: null },
          caption: null,
          outboundUrl: null,
        },
        {
          media: { type: 'animated', loop, gif: null, poster: null },
          caption: null,
          outboundUrl: null,
        },
      ],
    })
    expect(wide).toContain('aspect-ratio:1.7777777777777777')
  })

  it('renders link cards, with or without a thumbnail', async () => {
    const out = await render({
      type: 'link',
      url: 'https://example.com/story',
      domain: 'example.com',
      thumbnail: imageSet(),
    })
    expect(out).toContain(
      'href="https://example.com/story" target="_blank" rel="noopener noreferrer nofollow ugc"',
    )
    expect(out).toContain('sizes="8rem"')
    expect(
      await render({
        type: 'link',
        url: 'https://x.com',
        domain: 'x.com',
        thumbnail: imageSet({ srcSet: '' }),
      }),
    ).not.toContain('srcSet')
  })

  it('hides a link card’s thumbnail instead of wrapping it in a reveal', async () => {
    const out = await render(
      { type: 'link', url: 'https://x.com', domain: 'x.com', thumbnail: imageSet() },
      'nsfw',
    )
    expect(out).not.toContain('<img')
    expect(out).not.toContain('<details')
  })

  it('shows embeds as a link to the original until the provider facade lands', async () => {
    const out = await render({
      type: 'embed',
      poster: null,
      embed: {
        provider: 'youtube',
        title: 't',
        iframeSrc: 'https://www.youtube-nocookie.com/embed/x',
        aspectRatio: 1.7,
        height: null,
        allow: '',
        sandbox: '',
        originalUrl: 'https://youtu.be/x',
      },
    })
    expect(out).toContain('href="https://youtu.be/x"')
    expect(out).not.toContain('<iframe')
  })

  it('puts NSFW and spoiler media behind a native reveal with the pre-blurred image', async () => {
    const nsfw = await render({ type: 'image', image: imageSet({ blurred }) }, 'nsfw')
    expect(nsfw).toMatch(/^<div class="revealGroup"><details class="reveal"><summary/)
    // NSFW offers a one-click, permanent opt-out right under the blur; spoilers don't.
    expect(nsfw).toContain('name="blur" value="off"')
    expect(nsfw).toContain('Stop blurring NSFW media')
    expect(nsfw).toContain('src="https://preview.redd.it/blur.jpg"')
    expect(nsfw).toContain('>NSFW</span>Show')
    const spoiler = await render({ type: 'video', video, poster: null }, 'spoiler')
    expect(spoiler).toContain('class="placeholder"')
    expect(spoiler).toContain('>Spoiler</span>Show')
    expect(spoiler).not.toContain('Stop blurring')
  })
})

describe('blurredOf', () => {
  const withBlur = imageSet({ blurred })

  it('finds the blur on each kind of media', () => {
    expect(blurredOf({ type: 'image', image: withBlur })?.blurred).toBe(blurred)
    expect(blurredOf({ type: 'animated', loop, gif: withBlur, poster: null })?.blurred).toBe(
      blurred,
    )
    expect(blurredOf({ type: 'animated', loop, gif: null, poster: withBlur })?.blurred).toBe(
      blurred,
    )
    expect(blurredOf({ type: 'video', video, poster: withBlur })?.blurred).toBe(blurred)
    expect(
      blurredOf({
        type: 'gallery',
        items: [{ media: { type: 'image', image: withBlur }, caption: null, outboundUrl: null }],
      })?.blurred,
    ).toBe(blurred)
  })

  it('returns null without one', () => {
    expect(blurredOf({ type: 'image', image: imageSet() })).toBeNull()
    expect(blurredOf({ type: 'video', video, poster: null })).toBeNull()
  })
})

describe('RedditHtml', () => {
  it('renders sanitized HTML with optional classes', async () => {
    expect(await renderServer(<RedditHtml html={html('<p>Hi</p>')} />)).toBe(
      '<div class="root"><p>Hi</p></div>',
    )
    expect(await renderServer(<RedditHtml html={html('<p>Hi</p>')} className="x" />)).toBe(
      '<div class="root x"><p>Hi</p></div>',
    )
  })
})
