import 'server-only'
import { env } from '@/lib/env'
import { VIDEO_ALLOW, aspectOf, embed, lastSegment } from './shared'
import type { Provider } from './types'

/*
 * Video hosts whose embeds need only an id: Vimeo, Streamable, Twitch clips,
 * and TikTok. Each id is checked with a strict pattern before use.
 */

const VIMEO_ID = /^\d{6,12}$/
const VIMEO_HASH = /^[0-9a-f]{8,16}$/

export const vimeo: Provider = {
  id: 'vimeo',
  hosts: ['vimeo.com', 'player.vimeo.com', 'www.vimeo.com'],
  parse(url) {
    // vimeo.com/<id>[/<hash>], player.vimeo.com/video/<id>?h=<hash>
    const [first, second, third] = url.pathname.split('/').filter(Boolean)
    const id = first === 'video' ? second : first
    const hash = first === 'video' ? url.searchParams.get('h') : second
    if (!id || !VIMEO_ID.test(id)) return null
    return { id, hash: hash && VIMEO_HASH.test(hash) && !third ? hash : '' }
  },
  resolve({ id, hash }, link) {
    const src = new URL(`https://player.vimeo.com/video/${id}`)
    if (hash) src.searchParams.set('h', hash)
    src.searchParams.set('autoplay', '1')
    return embed(link, { provider: 'vimeo', iframeSrc: src.href })
  },
  csp: { frameSrc: ['https://player.vimeo.com'] },
}

const STREAMABLE_ID = /^[a-z0-9]{4,12}$/i

export const streamable: Provider = {
  id: 'streamable',
  hosts: ['streamable.com', 'www.streamable.com'],
  parse(url) {
    // streamable.com/<id>, /e/<id>, /o/<id> (the oEmbed form)
    const parts = url.pathname.split('/').filter(Boolean)
    const id =
      parts.length === 2 && (parts[0] === 'e' || parts[0] === 'o')
        ? parts[1]
        : parts.length === 1
          ? parts[0]
          : undefined
    return id && STREAMABLE_ID.test(id) ? { id } : null
  },
  resolve({ id }, link) {
    return embed(link, {
      provider: 'streamable',
      iframeSrc: `https://streamable.com/e/${id}?autoplay=1`,
    })
  },
  csp: { frameSrc: ['https://streamable.com'] },
}

const CLIP_SLUG = /^[A-Za-z0-9_-]{4,120}$/

export const twitch: Provider = {
  id: 'twitch',
  hosts: ['clips.twitch.tv', 'twitch.tv', 'www.twitch.tv', 'm.twitch.tv'],
  parse(url) {
    // clips.twitch.tv/<slug>, clips.twitch.tv/embed?clip=<slug>, twitch.tv/<user>/clip/<slug>
    const parts = url.pathname.split('/').filter(Boolean)
    const slug =
      url.hostname === 'clips.twitch.tv'
        ? parts[0] === 'embed'
          ? url.searchParams.get('clip')
          : lastSegment(url)
        : parts[1] === 'clip'
          ? parts[2]
          : null
    return slug && CLIP_SLUG.test(slug) ? { slug } : null
  },
  resolve({ slug }, link) {
    const src = new URL('https://clips.twitch.tv/embed')
    src.searchParams.set('clip', slug!)
    // Twitch refuses embeds without the embedding site's host.
    src.searchParams.set('parent', new URL(env.BASE_URL).hostname)
    src.searchParams.set('autoplay', 'true')
    return embed(link, { provider: 'twitch', iframeSrc: src.href })
  },
  csp: { frameSrc: ['https://clips.twitch.tv'] },
}

const TIKTOK_ID = /^\d{8,25}$/

export const tiktok: Provider = {
  id: 'tiktok',
  hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  parse(url) {
    // /@user/video/<id>, /embed/v2/<id>, /player/v1/<id> (the oEmbed form)
    const match = /^\/(?:@[^/]+\/video|embed\/v2|player\/v1)\/(\d+)/.exec(url.pathname)
    return match && TIKTOK_ID.test(match[1]!) ? { id: match[1]! } : null
  },
  resolve({ id }, link) {
    return embed(link, {
      provider: 'tiktok',
      iframeSrc: `https://www.tiktok.com/player/v1/${id}?autoplay=1&rel=0`,
      aspectRatio: aspectOf(link, 9 / 16),
      allow: VIDEO_ALLOW,
    })
  },
  csp: { frameSrc: ['https://www.tiktok.com'] },
}
