'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Post page error',
  context: 'PostPageError',
  containerSize: 'lg',
  centered: true
})
