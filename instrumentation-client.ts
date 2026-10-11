import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
import { nextjsPlugin } from '@datadog/browser-rum-nextjs'

export { onRouterTransitionStart } from '@datadog/browser-rum-nextjs'

/* The values come from `next.config.ts`, which inlines them at build time. */
const applicationId = process.env.DD_APPLICATION_ID
const clientToken = process.env.DD_CLIENT_TOKEN

/** A cancelled RSC prefetch fails with status 0 and an `_rsc=` URL, but isn't an error. */
function isCancelledPrefetch(statusCode: number | undefined, url: string | undefined) {
  return statusCode === 0 && Boolean(url?.includes('_rsc='))
}

if (applicationId && clientToken) {
  const shared = {
    clientToken,
    site: process.env.DD_SITE,
    service: process.env.DD_SERVICE,
    env: process.env.DD_ENV,
  }

  datadogRum.init({
    ...shared,
    applicationId,
    sessionSampleRate: 100,
    // No session replays: the About page tells readers none are recorded.
    sessionReplaySampleRate: 0,
    // Off: a long feed loads hundreds of images, and each one would be a RUM event.
    trackResources: false,
    trackUserInteractions: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    // Trace headers on the site's own requests (Server Actions, RSC payloads), so a slow
    // interaction in RUM links to its server trace in APM.
    allowedTracingUrls: [(url) => url.startsWith(window.location.origin)],
    traceSampleRate: 100,
    plugins: [nextjsPlugin()],
    beforeSend: (event) =>
      !(
        event.type === 'error' &&
        isCancelledPrefetch(event.error.resource?.status_code, event.error.resource?.url)
      ),
  })

  datadogLogs.init({
    ...shared,
    forwardErrorsToLogs: true,
    beforeSend: (log) =>
      !(log.status === 'error' && isCancelledPrefetch(log.http?.status_code, log.http?.url)),
  })
}
