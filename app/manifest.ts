import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

/** The web app manifest, so the site installs to a home screen with its icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.tagline,
    start_url: '/home',
    display: 'standalone',
    background_color: '#0e0e10',
    theme_color: '#0e0e10',
    icons: [
      { src: '/icon.png', sizes: '256x256', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
