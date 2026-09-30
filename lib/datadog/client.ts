import { datadogLogs } from '@datadog/browser-logs'

/** Browser logs. A no-op until `instrumentation-client.ts` initializes Datadog. */
export const logger = datadogLogs.logger
