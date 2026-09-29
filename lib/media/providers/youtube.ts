import 'server-only'
import { imageSet } from '../images'
import { embed, posterOf } from './shared'
import type { Provider } from './types'

const ID = /^[\w-]{11}$/
const TIME = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/

/** `t`/`start` as seconds: `90`, `90s`, `1m30s`, `1h2m3s`. Zero if absent or odd. */
export function parseStart(value: string | null): number {
  const match = value ? TIME.exec(value) : null
  if (!match) return 0
  const [, h = '0', m = '0', s = '0'] = match
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

/** YouTube videos, Shorts, and lives, played from the privacy-enhanced domain. */
export const youtube: Provider = {
  id: 'youtube',
  hosts: [
    'youtube.com',
    '.youtube.com',
    'youtu.be',
    'youtube-nocookie.com',
    '.youtube-nocookie.com',
  ],
  parse(url) {
    const path = /^\/(shorts|live|embed|v)\/([^/]+)/.exec(url.pathname)
    const id =
      url.hostname === 'youtu.be'
        ? url.pathname.slice(1).split('/')[0]
        : url.pathname === '/watch'
          ? url.searchParams.get('v')
          : path?.[2]
    if (!id || !ID.test(id)) return null
    return {
      id,
      start: String(parseStart(url.searchParams.get('t') ?? url.searchParams.get('start'))),
      shorts: String(path?.[1] === 'shorts'),
    }
  },
  resolve({ id, start, shorts }, link) {
    const src = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
    src.searchParams.set('autoplay', '1')
    src.searchParams.set('playsinline', '1')
    if (Number(start) > 0) src.searchParams.set('start', start!)
    return embed(link, {
      provider: 'youtube',
      iframeSrc: src.href,
      aspectRatio: shorts === 'true' ? 9 / 16 : 16 / 9,
      poster:
        posterOf(link) ??
        imageSet(
          { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 },
          [],
          null,
          ['i.ytimg.com'],
        ),
    })
  },
  csp: { frameSrc: ['https://www.youtube-nocookie.com'], imgSrc: ['https://i.ytimg.com'] },
}
