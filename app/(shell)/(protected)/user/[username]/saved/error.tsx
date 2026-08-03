'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Saved items page error',
  context: 'SavedItemsPageError',
  containerSize: 'lg'
})
