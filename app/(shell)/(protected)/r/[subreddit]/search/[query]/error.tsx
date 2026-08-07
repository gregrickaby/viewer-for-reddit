'use client'

import {createRouteErrorBoundary} from '@/components/ui/ErrorDisplay/RouteErrorBoundary'

export default createRouteErrorBoundary({
  message: 'Subreddit search page error',
  context: 'SubredditSearchPageError',
  containerSize: 'lg',
  centered: true
})
