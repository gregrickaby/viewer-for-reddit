import { describe, expect, it, vi } from 'vitest'
import { resolveMedia } from '@/lib/media/detect'
import { giphy, imgur, redgifs } from '@/lib/media/providers/animated-hosts'
import { social, soundcloud, spotify } from '@/lib/media/providers/audio-and-social'
import { PROVIDERS, cspSources, findProvider } from '@/lib/media/providers/registry'
import { aspectOf } from '@/lib/media/providers/shared'
import type { Provider } from '@/lib/media/providers/types'
import { streamable, tiktok, twitch, vimeo } from '@/lib/media/providers/video-hosts'
import { parseStart, youtube } from '@/lib/media/providers/youtube'
import { resolveDirectFile } from '@/lib/media/resolvers/direct-file'
import { oembedSrc } from '@/lib/media/resolvers/provider'
import { Link, type RedditLink } from '@/lib/reddit/schemas/link'
import type { PostMedia } from '@/lib/view-models'
import { type Sample, sample } from '@/tests/helpers/fixtures'

type Embed = Extract<PostMedia, { type: 'embed' }>

/** A real link post, pointed at `url` and stripped of Reddit's own media. */
function linkTo(url: string, edit?: (value: Sample) => void): RedditLink {
  const value = sample('Link', (v) => v.is_self === false && !v.removed_by_category && !v.is_video)
  Object.assign(value, {
    url,
    url_overridden_by_dest: url,
    is_gallery: false,
    media: null,
    secure_media: null,
  })
  delete value.preview
  edit?.(value)
  return Link.parse(value)
}

function parse(provider: Provider, url: string) {
  return provider.parse(new URL(url))
}

function embedOf(url: string, edit?: (value: Sample) => void): Embed['embed'] {
  const media = resolveMedia(linkTo(url, edit))
  expect(media.type).toBe('embed')
  return (media as Embed).embed
}

describe('URL safety', () => {
  it.each([
    'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
    'https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com@evil.com/watch?v=dQw4w9WgXcQ',
    'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
  ])('does not embed spoofed hosts: %s', (url) => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(resolveMedia(linkTo(url)).type).toBe('link')
  })

  it('renders nothing for non-web URLs', () => {
    expect(resolveMedia(linkTo('javascript:alert(1)')).type).toBe('none')
    expect(resolveMedia(linkTo('data:text/html,hi')).type).toBe('none')
  })

  it.each([
    [youtube, 'https://www.youtube.com/watch?v=short'],
    [youtube, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ"><script>'],
    [youtube, 'https://www.youtube.com/channel/UCQsrA4xo6jvdgsJZhKaBL6w'],
    [vimeo, 'https://vimeo.com/channels/staffpicks'],
    [streamable, 'https://streamable.com/a/b/c'],
    [twitch, 'https://www.twitch.tv/somestreamer'],
    [redgifs, 'https://www.redgifs.com/watch/a<b'],
    [giphy, 'https://giphy.com/explore/cats'],
    [imgur, 'https://imgur.com/user/someone'],
    [tiktok, 'https://www.tiktok.com/@user'],
    [spotify, 'https://open.spotify.com/genre/pop'],
    [soundcloud, 'https://soundcloud.com/a/b/c/d'],
  ] as const)('%s rejects %s', (provider, url) => {
    expect(parse(provider, url)).toBeNull()
  })
})

describe('YouTube', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('reads %s', (url, id) => {
    expect(parse(youtube, url)?.id).toBe(id)
  })

  it('plays from the privacy-enhanced domain with start times and a thumbnail poster', () => {
    const embed = embedOf('https://youtu.be/dQw4w9WgXcQ?t=1m30s')
    expect(embed).toMatchObject({ provider: 'youtube', aspectRatio: 16 / 9, height: null })
    expect(embed.iframeSrc).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&playsinline=1&start=90',
    )
    const media = resolveMedia(linkTo('https://youtu.be/dQw4w9WgXcQ')) as Embed
    expect(media.poster?.src).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })

  it('shows Shorts upright', () => {
    expect(embedOf('https://www.youtube.com/shorts/_6dXUdYxp3A?app=desktop').aspectRatio).toBe(
      9 / 16,
    )
  })

  it.each([
    [null, 0],
    ['90', 90],
    ['90s', 90],
    ['1m30s', 90],
    ['1h2m3s', 3723],
    ['soon', 0],
  ])('start %s → %d', (value, seconds) => {
    expect(parseStart(value)).toBe(seconds)
  })
})

describe('video hosts', () => {
  it('Vimeo, including unlisted hashes and player URLs', () => {
    expect(embedOf('https://vimeo.com/76979871').iframeSrc).toBe(
      'https://player.vimeo.com/video/76979871?autoplay=1',
    )
    expect(embedOf('https://vimeo.com/399761785/befce790d7?fl=pl').iframeSrc).toBe(
      'https://player.vimeo.com/video/399761785?h=befce790d7&autoplay=1',
    )
    expect(parse(vimeo, 'https://player.vimeo.com/video/95679262?h=abcdef1234')).toEqual({
      id: '95679262',
      hash: 'abcdef1234',
    })
    expect(parse(vimeo, 'https://vimeo.com/95679262/nothex')).toEqual({ id: '95679262', hash: '' })
  })

  it('Streamable, from the page, embed, and oEmbed forms', () => {
    for (const url of [
      'https://streamable.com/ewyo0w',
      'https://streamable.com/e/ewyo0w',
      'https://streamable.com/o/ewyo0w',
    ]) {
      expect(parse(streamable, url)).toEqual({ id: 'ewyo0w' })
    }
    expect(embedOf('https://streamable.com/ewyo0w').iframeSrc).toBe(
      'https://streamable.com/e/ewyo0w?autoplay=1',
    )
  })

  it('Twitch clips, with the parent host Twitch requires', () => {
    expect(
      parse(twitch, 'https://clips.twitch.tv/CuteInexpensiveMouseDerp-1AR3NlSp3PhUNxzu')?.slug,
    ).toBe('CuteInexpensiveMouseDerp-1AR3NlSp3PhUNxzu')
    expect(parse(twitch, 'https://www.twitch.tv/user/clip/ColdbloodedRacy-aA2j')?.slug).toBe(
      'ColdbloodedRacy-aA2j',
    )
    expect(parse(twitch, 'https://clips.twitch.tv/embed?clip=Abc-123_x')?.slug).toBe('Abc-123_x')
    expect(embedOf('https://clips.twitch.tv/CuteInexpensiveMouse').iframeSrc).toBe(
      'https://clips.twitch.tv/embed?clip=CuteInexpensiveMouse&parent=localhost&autoplay=true',
    )
  })

  it('TikTok, upright, from video, embed, and player URLs', () => {
    for (const url of [
      'https://www.tiktok.com/@someone/video/7688541379273690381',
      'https://www.tiktok.com/embed/v2/7688541379273690381',
      'https://www.tiktok.com/player/v1/7688541379273690381?autoplay=0',
    ]) {
      expect(parse(tiktok, url)).toEqual({ id: '7688541379273690381' })
    }
    const embed = embedOf('https://www.tiktok.com/@someone/video/7688541379273690381')
    expect(embed).toMatchObject({
      iframeSrc: 'https://www.tiktok.com/player/v1/7688541379273690381?autoplay=1&rel=0',
      aspectRatio: 9 / 16,
    })
  })
})

describe('animated hosts', () => {
  it('Redgifs embeds its own player (it has sound), from any URL form', () => {
    for (const url of [
      'https://www.redgifs.com/watch/palegreensamelcont',
      'https://redgifs.com/ifr/palegreensamelcont',
      'https://v3.redgifs.com/watch/palegreensamelcont',
      'https://thumbs2.redgifs.com/PaleGreenSamelCont-mobile.mp4',
    ]) {
      expect(parse(redgifs, url)).toEqual({ id: 'palegreensamelcont' })
    }
    expect(embedOf('https://www.redgifs.com/watch/palegreensamelcont').iframeSrc).toBe(
      'https://www.redgifs.com/ifr/palegreensamelcont',
    )
  })

  it('falls back to Reddit’s silent transcode when Redgifs gives no id', () => {
    const post = sample('Link', (v) => v.domain === 'redgifs.com')
    Object.assign(post, {
      url: 'https://www.redgifs.com/',
      url_overridden_by_dest: 'https://www.redgifs.com/',
      secure_media: null,
      media: null,
    })
    expect(resolveMedia(Link.parse(post)).type).toBe('animated')
  })

  it('Giphy plays as an MP4 loop, from page, media, and i. URLs', () => {
    for (const [url, id] of [
      ['https://giphy.com/gifs/reaction-meme-donkey-kong-4bmcP9arJpRTXPBXPx', '4bmcP9arJpRTXPBXPx'],
      ['https://media.giphy.com/media/cC3W82azCYQrHX7lQl/giphy.gif', 'cC3W82azCYQrHX7lQl'],
      [
        'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/nbNWgtnMgIYpUSy3e9/giphy.gif',
        'nbNWgtnMgIYpUSy3e9',
      ],
      ['https://i.giphy.com/cC3W82azCYQrHX7lQl.gif', 'cC3W82azCYQrHX7lQl'],
    ]) {
      expect(parse(giphy, url!)).toEqual({ id })
    }
    expect(resolveMedia(linkTo('https://giphy.com/gifs/kHIJtQ981gP1C'))).toMatchObject({
      type: 'animated',
      loop: {
        mp4: 'https://media.giphy.com/media/kHIJtQ981gP1C/giphy.mp4',
        width: 480,
        height: 270,
      },
      gif: { src: 'https://media.giphy.com/media/kHIJtQ981gP1C/giphy.gif' },
    })
  })

  it('Imgur: GIFV and GIF as MP4 loops, stills via Reddit’s preview, albums embedded', () => {
    expect(resolveMedia(linkTo('https://i.imgur.com/zNdTy3j.gifv'))).toMatchObject({
      type: 'animated',
      loop: { mp4: 'https://i.imgur.com/zNdTy3j.mp4' },
    })
    expect(parse(imgur, 'https://i.imgur.com/bFnEmAn.jpg')).toEqual({ id: 'bFnEmAn', ext: 'jpg' })
    expect(parse(imgur, 'https://imgur.com/gallery/very-satisfying-C9391gR')).toEqual({
      id: 'C9391gR',
      ext: 'album',
    })
    expect(embedOf('https://imgur.com/a/C9391gR').iframeSrc).toBe(
      'https://imgur.com/a/C9391gR/embed?pub=true',
    )
    // A still without Reddit's preview has no size, so it falls through to a link.
    vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(resolveMedia(linkTo('https://i.imgur.com/bFnEmAn.jpg')).type).toBe('link')
  })

  it('Imgur stills use Reddit’s preview when there is one', () => {
    const post = sample('Link', (v) => v.post_hint === 'image' && v.over_18 === false)
    Object.assign(post, {
      url: 'https://i.imgur.com/bFnEmAn.jpg',
      url_overridden_by_dest: 'https://i.imgur.com/bFnEmAn.jpg',
      domain: 'i.imgur.com',
    })
    expect(resolveMedia(Link.parse(post)).type).toBe('image')
  })
})

describe('audio and social', () => {
  it('Spotify: fixed heights, locale segments ignored', () => {
    expect(embedOf('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC')).toMatchObject({
      iframeSrc: 'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
      height: 152,
    })
    expect(
      embedOf('https://open.spotify.com/intl-de/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x').height,
    ).toBe(352)
  })

  it('SoundCloud: tracks, sets, and share links', () => {
    expect(parse(soundcloud, 'https://soundcloud.com/artist/track-name')).toEqual({
      url: 'https://soundcloud.com/artist/track-name',
    })
    expect(parse(soundcloud, 'https://m.soundcloud.com/artist/sets/album')).toEqual({
      url: 'https://soundcloud.com/artist/sets/album',
    })
    expect(parse(soundcloud, 'https://on.soundcloud.com/tiYBWkcpppt60HzLUB')).toEqual({
      url: 'https://on.soundcloud.com/tiYBWkcpppt60HzLUB',
    })
    expect(parse(soundcloud, 'https://on.soundcloud.com/a/b')).toBeNull()
    expect(embedOf('https://soundcloud.com/artist/track-name')).toMatchObject({
      iframeSrc:
        'https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack-name&auto_play=true',
      height: 166,
    })
  })

  it('social sites are link cards, never script embeds', () => {
    for (const url of [
      'https://x.com/someone/status/1',
      'https://www.instagram.com/p/abc/',
      'https://fb.watch/xyz/',
    ]) {
      expect(findProvider(new URL(url))).toBe(social)
      expect(resolveMedia(linkTo(url)).type).toBe('link')
    }
  })
})

describe('oEmbed fallback', () => {
  const withOembed = (html: string, url = 'https://vm.tiktok.com/ZGdQhsHnH/') =>
    linkTo(url, (v) => {
      v.secure_media = { type: 'tiktok.com', oembed: { html, width: 720, height: 1280 } }
    })

  it('reads the player URL from Reddit’s oEmbed markup', () => {
    const link = withOembed(
      '<iframe width="720" src="https://www.tiktok.com/player/v1/7684370407817760031?&amp;autoplay=0" ></iframe>',
    )
    expect(oembedSrc(link)?.href).toBe(
      'https://www.tiktok.com/player/v1/7684370407817760031?&autoplay=0',
    )
    expect(resolveMedia(link)).toMatchObject({
      type: 'embed',
      embed: { provider: 'tiktok', aspectRatio: 720 / 1280 },
    })
  })

  it('unwraps Embedly', () => {
    const html =
      '<iframe class="embedly-embed" src="https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fplayer.vimeo.com%2Fvideo%2F95679262%3Fapp_id%3D122963&amp;type=text%2Fhtml" width="600"></iframe>'
    const link = withOembed(html, 'https://vimeo.com/flyingpaper/film')
    expect(resolveMedia(link)).toMatchObject({
      type: 'embed',
      embed: { iframeSrc: 'https://player.vimeo.com/video/95679262?autoplay=1' },
    })
  })

  it('ignores markup without a usable src, and hosts no provider knows', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(oembedSrc(withOembed('<blockquote>no iframe</blockquote>'))).toBeNull()
    expect(oembedSrc(withOembed('<iframe src="javascript:alert(1)"></iframe>'))).toBeNull()
    expect(
      oembedSrc(
        withOembed('<iframe src="https://cdn.embedly.com/widgets/media.html?type=x"></iframe>'),
      ),
    ).toBeNull()
    expect(resolveMedia(withOembed('<iframe src="https://evil.com/player/1"></iframe>')).type).toBe(
      'link',
    )
  })

  it('links the facade to the post on Reddit when the post’s own URL is unsafe', () => {
    const link = withOembed(
      '<iframe src="https://www.tiktok.com/player/v1/7684370407817760031"></iframe>',
      'javascript:alert(1)',
    )
    expect(resolveMedia(link)).toMatchObject({
      type: 'embed',
      embed: { originalUrl: `https://www.reddit.com${link.permalink}` },
    })
  })
})

describe('direct files', () => {
  const direct = (url: string) => {
    const post = sample('Link', (v) => v.post_hint === 'image' && v.over_18 === false)
    Object.assign(post, { url, url_overridden_by_dest: url })
    return resolveDirectFile(Link.parse(post))
  }

  it('turns files on Reddit media hosts into loops, GIFs, and images', () => {
    expect(direct('https://i.redd.it/abc.mp4')).toMatchObject({
      type: 'animated',
      loop: { mp4: 'https://i.redd.it/abc.mp4' },
    })
    expect(direct('https://i.redd.it/abc.gif')).toMatchObject({
      type: 'animated',
      loop: null,
      gif: { src: 'https://i.redd.it/abc.gif' },
    })
    expect(direct('https://i.redd.it/abc.png')?.type).toBe('image')
  })

  it('ignores other hosts, other types, and posts without a preview', () => {
    expect(direct('https://example.com/abc.mp4')).toBeNull()
    expect(direct('https://i.redd.it/abc.txt')).toBeNull()
    expect(resolveDirectFile(linkTo('https://i.redd.it/abc.png'))).toBeNull()
  })
})

describe('registry', () => {
  it('lists each provider once and collects CSP sources', () => {
    expect(new Set(PROVIDERS.map((provider) => provider.id)).size).toBe(PROVIDERS.length)
    expect(cspSources('frameSrc')).toContain('https://www.youtube-nocookie.com')
    expect(cspSources('imgSrc')).toEqual([
      'https://i.imgur.com',
      'https://i.ytimg.com',
      'https://media.giphy.com',
    ])
    expect(findProvider(new URL('https://example.com/'))).toBeNull()
  })

  it('falls back to 16:9 without size information', () => {
    expect(aspectOf(linkTo('https://example.com/'))).toBe(16 / 9)
  })
})
