'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Subreddit page error',
  context: 'SubredditPageError',
  containerSize: 'lg',
  centered: true
})
