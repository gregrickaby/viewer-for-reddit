import 'server-only'
import { resolveLinkCard } from '../resolvers/link-card'
import { embed } from './shared'
import type { Provider } from './types'

/*
 * Audio players have a fixed height rather than an aspect ratio. Social
 * sites are recognized only so they become plain link cards: their embeds
 * need third-party scripts, which the app never loads (design §8.7).
 */

const SPOTIFY_TYPES = new Set(['track', 'album', 'playlist', 'episode', 'show', 'artist'])
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/

export const spotify: Provider = {
  id: 'spotify',
  hosts: ['open.spotify.com'],
  parse(url) {
    // /<type>/<id>, optionally behind a locale segment such as /intl-de/
    const parts = url.pathname.split('/').filter((part) => part && !part.startsWith('intl-'))
    const [type, id] = parts
    return type && id && SPOTIFY_TYPES.has(type) && SPOTIFY_ID.test(id) ? { type, id } : null
  },
  resolve({ type, id }, link) {
    return embed(link, {
      provider: 'spotify',
      iframeSrc: `https://open.spotify.com/embed/${type}/${id}`,
      height: type === 'track' || type === 'episode' ? 152 : 352,
      allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
    })
  },
  csp: { frameSrc: ['https://open.spotify.com'] },
}

const SOUNDCLOUD_PATH = /^\/[A-Za-z0-9_-]{1,64}(?:\/[A-Za-z0-9_-]{1,120}){1,2}\/?$/

export const soundcloud: Provider = {
  id: 'soundcloud',
  hosts: ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com', 'on.soundcloud.com'],
  parse(url) {
    // A track (/<user>/<track>), a set (/<user>/sets/<name>), or a share link (on.soundcloud.com/<code>).
    const valid =
      url.hostname === 'on.soundcloud.com'
        ? /^\/[A-Za-z0-9]{6,32}\/?$/.test(url.pathname)
        : SOUNDCLOUD_PATH.test(url.pathname)
    if (!valid) return null
    return {
      url: `https://${url.hostname === 'on.soundcloud.com' ? 'on.soundcloud.com' : 'soundcloud.com'}${url.pathname}`,
    }
  },
  resolve({ url }, link) {
    const src = new URL('https://w.soundcloud.com/player/')
    src.searchParams.set('url', url!)
    src.searchParams.set('auto_play', 'true')
    return embed(link, {
      provider: 'soundcloud',
      iframeSrc: src.href,
      height: 166,
      allow: 'autoplay',
    })
  },
  csp: { frameSrc: ['https://w.soundcloud.com'] },
}

export const social: Provider = {
  id: 'social',
  hosts: [
    'twitter.com',
    '.twitter.com',
    'x.com',
    '.x.com',
    'instagram.com',
    '.instagram.com',
    'facebook.com',
    '.facebook.com',
    'fb.watch',
    'threads.net',
    '.threads.net',
    'bsky.app',
  ],
  parse: () => ({}),
  resolve: (_, link) => resolveLinkCard(link),
  csp: {},
}
