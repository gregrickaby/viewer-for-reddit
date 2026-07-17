/**
 * Application configuration
 * Static metadata and branding information
 */

import {getEnvVar} from '@/lib/utils/env'

export const appConfig = {
  // Site metadata
  site: {
    name: 'Reddit Viewer',
    description: 'Surf Reddit without ads, analytics, and algorithms',
    metaDescription:
      'Reddit Viewer is a clean way to browse Reddit without ads, analytics, or algorithms. Sign in with your Reddit account to get started.',
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
