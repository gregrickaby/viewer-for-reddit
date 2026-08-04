import {datadogLogs} from '@datadog/browser-logs'
import {datadogRum} from '@datadog/browser-rum'
import {nextjsPlugin} from '@datadog/browser-rum-nextjs'

export {onRouterTransitionStart} from '@datadog/browser-rum-nextjs'

/**
 * Cancelled Next.js RSC prefetch requests surface as fetch failures
 * (status_code 0, `_rsc=` query param) but aren't real errors.
 */
function isCancelledRscPrefetch(
  statusCode: number | undefined,
  url: string | undefined
): boolean {
  return statusCode === 0 && Boolean(url?.includes('_rsc='))
}

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
      isCancelledRscPrefetch(
        event.error.resource?.status_code,
        event.error.resource?.url
      )
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
  forwardErrorsToLogs: true,
  beforeSend: (log) => {
    if (
      log.status === 'error' &&
      isCancelledRscPrefetch(log.http?.status_code, log.http?.url)
    ) {
      return false
    }
    return true
  }
})
