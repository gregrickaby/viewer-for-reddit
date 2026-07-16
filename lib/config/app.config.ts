/**
 * Application configuration
 * Static metadata and branding information
 */

import {getEnvVar} from '@/lib/utils/env'

export const appConfig = {
  // Site metadata
  site: {
    name: 'Reddit Viewer',
    description: 'A different way to surf Reddit',
    metaDescription:
      'A different way to surf Reddit - browse images, videos, gifs, and posts without targeted ads or algorithms.',
    baseUrl: getEnvVar('BASE_URL')
  },

  // Author information
  author: {
    name: 'Greg Rickaby',
    url: 'https://gregrickaby.com'
  },

  // External links
  links: {
    github: 'https://github.com/gregrickaby/reddit-viewer'
  }
} as const
