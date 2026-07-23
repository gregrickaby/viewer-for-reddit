import {datadogLogs} from '@datadog/browser-logs'
import {datadogRum} from '@datadog/browser-rum'
import {
  nextjsPlugin,
  onRouterTransitionStart
} from '@datadog/browser-rum-nextjs'

export {onRouterTransitionStart}

datadogRum.init({
  applicationId: process.env.DD_APPLICATION_ID!,
  clientToken: process.env.DD_CLIENT_TOKEN!,
  site: process.env.DD_SITE,
  service: process.env.DD_SERVICE,
  env: process.env.NODE_ENV,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackResources: true,
  trackUserInteractions: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
  plugins: [nextjsPlugin()]
})

datadogLogs.init({
  clientToken: process.env.DD_CLIENT_TOKEN!,
  site: process.env.DD_SITE,
  service: process.env.DD_SERVICE,
  env: process.env.NODE_ENV,
  forwardErrorsToLogs: true
})
