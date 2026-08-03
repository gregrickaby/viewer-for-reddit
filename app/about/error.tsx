'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'About page error',
  context: 'AboutPageError',
  containerSize: 'md',
  containerPy: 'xl'
})
