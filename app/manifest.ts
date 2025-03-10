import config from '@/lib/config'
import { MetadataRoute } from 'next'

/**
 * The manifest.webmanifest route.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.siteName,
    short_name: config.siteName,
    description: config.siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#18181b',
    theme_color: '#18181b',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png'
      }
    ]
  }
}
