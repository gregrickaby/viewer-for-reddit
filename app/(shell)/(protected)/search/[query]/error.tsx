'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Search page error',
  context: 'SearchPageError',
  containerSize: 'lg',
  centered: true
})
