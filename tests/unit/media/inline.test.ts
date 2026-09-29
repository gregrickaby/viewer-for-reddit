import { describe, expect, it } from 'vitest'
import { inlineFor, inlineMedia } from '@/lib/media/inline'
import { sanitizeRedditHtml } from '@/lib/reddit/sanitize'
import { sample, samples } from '@/tests/helpers/fixtures'

const bare = (url: string) =>
  `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow ugc">${url}</a>`
const animated = sample(
  'MediaMetadataItem',
  (v) => v.e === 'AnimatedImage' && typeof v.ext !== 'string',
)
const image = sample('MediaMetadataItem', (v) => v.e === 'Image' && v.status === 'valid')

describe('inlineFor', () => {
  it('uses media_metadata for uploads, keyed by file name', () => {
    const id = String(animated.id)
    expect(inlineFor(`https://i.redd.it/${id}.gif`, { [id]: animated })).toMatchObject({
      kind: 'loop',
      mp4: expect.stringMatching(/^https:\/\/preview\.redd\.it\//),
      width: (animated.s as { x: number }).x,
    })
    const imageId = String(image.id)
    expect(
      inlineFor(`https://preview.redd.it/${imageId}.jpg?width=640`, { [imageId]: image }),
    ).toMatchObject({
      kind: 'image',
      srcSet: expect.stringContaining('w,'),
    })
  })

  it('still shows unknown uploads that are images, without a size', () => {
    expect(inlineFor('https://i.redd.it/unknown.png', {})).toMatchObject({
      kind: 'image',
      width: null,
    })
    expect(inlineFor('https://i.redd.it/unknown.mp4', {})).toBeNull()
  })

  it('plays Giphy-picker GIFs as MP4 loops, sized when Reddit knows the size', () => {
    expect(inlineFor('https://giphy.com/gifs/pHMEDO9sh8iha', {})).toEqual({
      kind: 'loop',
      mp4: 'https://media.giphy.com/media/pHMEDO9sh8iha/giphy.mp4',
      poster: null,
      width: null,
      height: null,
    })
    const picker = sample('MediaMetadataItem', (v) => typeof v.ext === 'string')
    const id = String(picker.ext).split('/').at(-1)!.split('-').at(-1)!
    expect(inlineFor(`https://giphy.com/gifs/${id}`, { [`giphy|${id}`]: picker })).toMatchObject({
      width: expect.any(Number),
    })
    expect(inlineFor('https://giphy.com/explore/cats', {})).toBeNull()
  })

  it('turns Imgur GIFVs into loops and stills into images', () => {
    expect(inlineFor('https://i.imgur.com/zNdTy3j.gifv', {})).toMatchObject({
      kind: 'loop',
      mp4: 'https://i.imgur.com/zNdTy3j.mp4',
    })
    expect(inlineFor('https://i.imgur.com/bFnEmAn.jpg', {})).toMatchObject({
      kind: 'image',
      src: 'https://i.imgur.com/bFnEmAn.jpg',
    })
    expect(inlineFor('https://i.imgur.com/bFnEmAn.txt', {})).toBeNull()
  })

  it('ignores other hosts and broken URLs', () => {
    expect(inlineFor('https://example.com/a.gif', {})).toBeNull()
    expect(inlineFor('https://i.redd.it.evil.com/a.gif', {})).toBeNull()
    expect(inlineFor('not a url', {})).toBeNull()
  })
})

describe('inlineMedia', () => {
  it('replaces bare media links with inline media', () => {
    const html = `<p>${bare('https://i.imgur.com/zNdTy3j.gifv')}</p>`
    expect(inlineMedia(html, null)).toBe(
      '<p><span data-inline-media><video src="https://i.imgur.com/zNdTy3j.mp4" muted loop playsinline autoplay preload="metadata"></video></span></p>',
    )
  })

  it('renders sized images linking to the original, with a srcset', () => {
    const id = String(image.id)
    const out = inlineMedia(bare(`https://preview.redd.it/${id}.jpg`), { [id]: image })
    expect(out).toMatch(
      /^<span data-inline-media><a href="https:\/\/preview\.redd\.it\/[^"]+" target="_blank" rel="noopener noreferrer"><img src="[^"]+" srcset="[^"]+" sizes="[^"]+" width="\d+" height="\d+" alt="" loading="lazy" decoding="async"><\/a><\/span>$/,
    )
  })

  it('adds a poster and size to known animated uploads', () => {
    const id = String(animated.id)
    expect(inlineMedia(bare(`https://i.redd.it/${id}.gif`), { [id]: animated })).toMatch(
      /<video src="[^"]+" poster="[^"]+" width="\d+" height="\d+" muted/,
    )
  })

  it('keeps links with real text, and links to other hosts', () => {
    const titled = '<a href="https://i.imgur.com/zNdTy3j.gifv" target="_blank" rel="x">this gif</a>'
    expect(inlineMedia(titled, null)).toBe(titled)
    expect(inlineMedia(bare('https://example.com/a.gif'), null)).toBe(
      bare('https://example.com/a.gif'),
    )
  })

  it('handles empty link text and escaped characters', () => {
    expect(inlineMedia('<a href="https://i.redd.it/x.png"></a>', {})).toContain(
      '<img src="https://i.redd.it/x.png"',
    )
    const amp = 'https://i.redd.it/x.png?a=1&amp;b=2'
    expect(inlineMedia(`<a href="${amp}">${amp}</a>`, {})).toContain(
      'src="https://i.redd.it/x.png?a=1&amp;b=2"',
    )
  })

  it('falls back to the GIF when an animated upload has no MP4', () => {
    const gifOnly = { ...animated, s: { ...(animated.s as object), mp4: undefined } }
    const id = String(animated.id)
    expect(inlineFor(`https://i.redd.it/${id}.gif`, { [id]: gifOnly })).toMatchObject({
      kind: 'image',
    })
  })
})

describe('sanitizeRedditHtml with inline media', () => {
  it('applies only when asked', () => {
    const html = `<div class="md"><p><a href="https://giphy.com/gifs/pHMEDO9sh8iha">https://giphy.com/gifs/pHMEDO9sh8iha</a></p></div>`
    expect(sanitizeRedditHtml(html)).not.toContain('<video')
    expect(sanitizeRedditHtml(html, { inlineMedia: { metadata: null } })).toContain(
      '<video src="https://media.giphy.com/media/pHMEDO9sh8iha/giphy.mp4"',
    )
  })

  it('shows real comment media inline', () => {
    const comment = samples('Comment').find((value) =>
      String(value.body_html).includes('giphy.com/gifs'),
    )
    if (!comment) return
    expect(
      sanitizeRedditHtml(String(comment.body_html), { inlineMedia: { metadata: null } }),
    ).toContain('giphy.mp4')
  })
})
