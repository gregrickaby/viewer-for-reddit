'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'User profile page error',
  context: 'UserProfilePageError',
  containerSize: 'lg',
  centered: true
})
