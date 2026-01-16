import {appConfig} from '@/lib/config/app.config'
import {MetadataRoute} from 'next'

/**
 * The manifest.webmanifest route.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.site.name,
    short_name: appConfig.site.name,
    description: appConfig.site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#242424',
    theme_color: '#242424',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png'
      }
    ]
  }
}
