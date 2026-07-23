/**
 * Server-side structured logger backed by the Datadog Logs Intake API.
 *
 * Plain `fetch` (no SDK) so this works identically in the Edge runtime
 * (proxy.ts) and the Node.js runtime (server actions, route handlers,
 * instrumentation.ts). Each call returns the delivery promise so callers
 * can `await` it or pass it to `event.waitUntil()`.
 */

type LogFields = Record<string, unknown>
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const DD_SITE = process.env.DD_SITE || 'datadoghq.com'
const DD_SERVICE = process.env.DD_SERVICE || 'reddit-viewer'
const LOGS_URL = `https://http-intake.logs.${DD_SITE}/api/v2/logs`

async function send(
  level: LogLevel,
  message: string,
  fields?: LogFields
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    if (level === 'error') {
      console.error(message, fields ?? '')
    } else if (level === 'warn') {
      console.warn(message, fields ?? '')
    } else {
      console.info(message, fields ?? '')
    }
    return
  }

  try {
    await fetch(LOGS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DD_API_KEY!
      },
      body: JSON.stringify([
        {
          message,
          level,
          service: DD_SERVICE,
          ddsource: 'nextjs',
          ddtags: `env:${process.env.NODE_ENV}`,
          ...fields
        }
      ])
    })
  } catch {
    // Never let a logging failure break the request that triggered it.
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) =>
    send('debug', message, fields),
  info: (message: string, fields?: LogFields) => send('info', message, fields),
  warn: (message: string, fields?: LogFields) => send('warn', message, fields),
  error: (message: string, fields?: LogFields) => send('error', message, fields)
}
