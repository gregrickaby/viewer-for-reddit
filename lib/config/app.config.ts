/**
 * Application configuration
 * Static metadata and branding information
 */

import {getEnvVar} from '@/lib/utils/env'

export const appConfig = {
  // Site metadata
  site: {
    name: 'Viewer for Reddit',
    description: 'Surf Reddit without ads or algorithms',
    metaDescription:
      'Viewer for Reddit is a clean way to browse Reddit without ads or algorithms. Sign in with your Reddit account to get started.',
    baseUrl: getEnvVar('BASE_URL')
  },

  // Author information
  author: {
    name: 'Greg Rickaby',
    url: 'https://gregrickaby.com'
  },

  // External links
  links: {
    github: 'https://github.com/gregrickaby/viewer-for-reddit'
  }
} as const
