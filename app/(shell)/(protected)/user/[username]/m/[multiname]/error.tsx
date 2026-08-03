'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Multireddit page error',
  context: 'MultiredditPageError',
  containerSize: 'lg',
  centered: true
})
