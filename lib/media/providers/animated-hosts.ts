import 'server-only'
import type { ImageSet, PostMedia } from '@/lib/view-models'
import { imageSet, loopVideo } from '../images'
import { aspectOf, embed, lastSegment, posterOf } from './shared'
import type { Provider } from './types'

/*
 * GIF-style hosts. Redgifs embeds its own player (it has audio); Giphy and
 * Imgur serve MP4 loops directly, which play like GIFs at a fraction of the size.
 */

const REDGIFS_ID = /^[a-zA-Z0-9]{3,64}$/

export const redgifs: Provider = {
  id: 'redgifs',
  hosts: ['redgifs.com', '.redgifs.com'],
  parse(url) {
    // /watch/<id>, /ifr/<id>, /<id>, or a file name like <id>-mobile.mp4
    const id = lastSegment(url).split(/[.-]/)[0]
    return id && REDGIFS_ID.test(id) ? { id: id.toLowerCase() } : null
  },
  resolve({ id }, link) {
    // Preferred over Reddit's transcode, which is often silent (design §8.7).
    return embed(link, { provider: 'redgifs', iframeSrc: `https://www.redgifs.com/ifr/${id}` })
  },
  csp: { frameSrc: ['https://www.redgifs.com'] },
}

const GIPHY_ID = /^[A-Za-z0-9]{6,40}$/
const GIPHY_HOSTS = ['.giphy.com'] as const

/** A Giphy loop sized from Reddit's preview (Giphy URLs carry no size). */
export function giphyMedia(id: string, poster: ImageSet | null): PostMedia | null {
  const width = poster?.width ?? 480
  const height = poster?.height ?? 270
  const loop = loopVideo(
    `https://media.giphy.com/media/${id}/giphy.mp4`,
    width,
    height,
    GIPHY_HOSTS,
  )
  const gif = imageSet(
    { url: `https://media.giphy.com/media/${id}/giphy.gif`, width, height },
    [],
    null,
    GIPHY_HOSTS,
  )
  return loop || gif ? { type: 'animated', loop, gif, poster } : null
}

export const giphy: Provider = {
  id: 'giphy',
  hosts: ['giphy.com', '.giphy.com'],
  parse(url) {
    const parts = url.pathname.split('/').filter(Boolean)
    // giphy.com/gifs/<slug>-<id> · media*.giphy.com/media/[v1.<token>/]<id>/giphy.gif · i.giphy.com/<id>.gif
    const id =
      parts[0] === 'gifs'
        ? parts[1]?.split('-').at(-1)
        : parts[0] === 'media'
          ? parts[1]?.startsWith('v1.')
            ? parts[2]
            : parts[1]
          : url.hostname === 'i.giphy.com'
            ? parts[0]?.split('.')[0]
            : undefined
    return id && GIPHY_ID.test(id) ? { id } : null
  },
  resolve({ id }, link) {
    return giphyMedia(id!, posterOf(link))
  },
  csp: { mediaSrc: ['https://media.giphy.com'], imgSrc: ['https://media.giphy.com'] },
}

const IMGUR_ID = /^[A-Za-z0-9]{5,10}$/
const IMGUR_HOSTS = ['i.imgur.com'] as const

export const imgur: Provider = {
  id: 'imgur',
  hosts: ['imgur.com', 'i.imgur.com', 'm.imgur.com'],
  parse(url) {
    const parts = url.pathname.split('/').filter(Boolean)
    if (url.hostname === 'i.imgur.com') {
      const match = /^([A-Za-z0-9]{5,10})\.(gifv|gif|mp4|jpe?g|png|webp)$/i.exec(parts[0] ?? '')
      return match ? { id: match[1]!, ext: match[2]!.toLowerCase() } : null
    }
    // imgur.com/a/<id> and /gallery/<id>, where newer URLs prefix a slug: <slug>-<id>
    if ((parts[0] === 'a' || parts[0] === 'gallery') && parts[1]) {
      const id = parts[1].split('-').at(-1)!
      return IMGUR_ID.test(id) ? { id, ext: 'album' } : null
    }
    return null
  },
  resolve({ id, ext }, link) {
    const poster = posterOf(link)
    if (ext === 'album') {
      return embed(link, {
        provider: 'imgur',
        iframeSrc: `https://imgur.com/a/${id}/embed?pub=true`,
        aspectRatio: aspectOf(link, 1),
      })
    }
    if (ext === 'gifv' || ext === 'gif' || ext === 'mp4') {
      const size = poster ?? { width: 480, height: 480 }
      const loop = loopVideo(`https://i.imgur.com/${id}.mp4`, size.width, size.height, IMGUR_HOSTS)
      return loop ? { type: 'animated', loop, gif: null, poster } : null
    }
    // A still: Reddit's preview is the same image, already resized.
    return poster ? { type: 'image', image: poster } : null
  },
  csp: {
    frameSrc: ['https://imgur.com'],
    mediaSrc: ['https://i.imgur.com'],
    imgSrc: ['https://i.imgur.com'],
  },
}
