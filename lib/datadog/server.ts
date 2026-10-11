import 'server-only'
import tracer from 'dd-trace'
import { after } from 'next/server'
import { env } from '@/lib/env'

/*
 * Structured server logs for Datadog's Logs Intake API. Plain `fetch`, so it
 * works in the proxy and the Node runtime alike. Without `DD_API_KEY`, or
 * outside production, entries go to the console instead.
 */

type LogFields = Record<string, unknown>
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOGS_URL = `https://http-intake.logs.${env.DD_SITE}/api/v2/logs`

function toConsole(level: LogLevel, message: string, fields?: LogFields) {
  const write = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  write(message, fields ?? '')
}

/**
 * `dd.trace_id` and `dd.span_id` of the active span, so Datadog links the entry to its
 * APM trace. The tracer only adds them on its own to loggers it patches; this one posts
 * over HTTP. Empty when nothing is traced (dev, tests, or outside a request).
 */
function traceFields(): LogFields {
  const span = tracer.scope().active()
  if (!span) return {}
  const record: LogFields = {}
  tracer.inject(span.context(), 'log', record)
  return record
}

async function deliver(level: LogLevel, message: string, fields?: LogFields): Promise<void> {
  try {
    await fetch(LOGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'DD-API-KEY': env.DD_API_KEY! },
      body: JSON.stringify([
        {
          message,
          status: level,
          service: env.DD_SERVICE,
          ddsource: 'nextjs',
          ddtags: `env:${env.DD_ENV ?? process.env.NODE_ENV}`,
          ...fields,
        },
      ]),
    })
  } catch {
    // A logging failure must never break the request that triggered it.
  }
}

function send(level: LogLevel, message: string, fields?: LogFields): void {
  if (process.env.NODE_ENV !== 'production' || !env.DD_API_KEY) {
    toConsole(level, message, fields)
    return
  }
  // Read the span now: by the time `after` runs, the request's span has ended.
  const delivery = deliver(level, message, { ...traceFields(), ...fields })
  try {
    // Keeps a serverless function alive until the log is sent.
    after(delivery)
  } catch {
    // Outside a request (build, tests): the fetch is already running.
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => send('debug', message, fields),
  info: (message: string, fields?: LogFields) => send('info', message, fields),
  warn: (message: string, fields?: LogFields) => send('warn', message, fields),
  error: (message: string, fields?: LogFields) => send('error', message, fields),
}
