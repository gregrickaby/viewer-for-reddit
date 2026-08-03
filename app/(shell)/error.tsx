'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

/**
 * Error boundary for main layout routes: /, /r/*, /u/*, /search/*, etc.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default createRouteErrorBoundary({
  message: 'Route error caught',
  context: 'MainLayoutError'
})
