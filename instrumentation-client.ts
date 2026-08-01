import {datadogLogs} from '@datadog/browser-logs'
import {datadogRum} from '@datadog/browser-rum'
import {nextjsPlugin} from '@datadog/browser-rum-nextjs'

export {onRouterTransitionStart} from '@datadog/browser-rum-nextjs'

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
  plugins: [nextjsPlugin()],
  beforeSend: (event) => {
    if (
      event.type === 'error' &&
      event.error.resource?.status_code === 0 &&
      event.error.resource.url.includes('_rsc=')
    ) {
      return false
    }
    return true
  }
})

datadogLogs.init({
  clientToken: process.env.DD_CLIENT_TOKEN!,
  site: process.env.DD_SITE,
  service: process.env.DD_SERVICE,
  env: process.env.NODE_ENV,
  forwardErrorsToLogs: true
})
