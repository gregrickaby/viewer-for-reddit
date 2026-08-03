'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Donate page error',
  context: 'DonatePageError',
  containerSize: 'md',
  containerPy: 'xl'
})
