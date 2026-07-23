'use client'

import {datadogLogs} from '@datadog/browser-logs'

/**
 * Client-side structured logger.
 *
 * Initialization happens once in `instrumentation-client.ts`; this module
 * only re-exports the logger so call sites keep the same
 * `logger.error(message, fields)` shape used on the server.
 */
export const logger = datadogLogs.logger
