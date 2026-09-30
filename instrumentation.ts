import type { Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { logger } = await import('@/lib/datadog/server')
  const { digest } = error as { digest?: string }
  logger.error(error instanceof Error ? error.message : 'Unhandled request error', {
    digest,
    stack: error instanceof Error ? error.stack : undefined,
    request: { path: request.path, method: request.method },
    context,
  })
}
