import type {Instrumentation} from 'next'
import {logger} from '@/lib/datadog/server'

// dd-trace APM is initialized via NODE_OPTIONS='--require dd-trace/init' in
// the dev/start scripts (package.json), not here — dd-trace patches Node's
// module loader and must run before Next.js is first required, which has
// already happened by the time this file's register() would run.

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const message = err instanceof Error ? err.message : String(err)
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err
      ? String(err.digest)
      : undefined

  await logger.error(message, {digest, request, context})
}
