'use client'

import {usePostNavigation} from '@/lib/contexts/PostNavigationContext'
import {useEffect} from 'react'

/**
 * Props for PostPageTracker component.
 */
interface PostPageTrackerProps {
  /** Reddit post ID to track */
  postId: string
}

/**
 * PostPageTracker - tracks the currently viewed post for swipe navigation.
 *
 * This client component sets the current post ID in the PostNavigationContext
 * when viewing a single post page, enabling swipe-left-to-next-post navigation.
 *
 * Must be used within PostNavigationProvider.
 *
 * @param postId - The ID of the current post
 *
 * @example
 * ```typescript
 * <PostPageTracker postId="t3_abc123" />
 * ```
 */
export function PostPageTracker({postId}: Readonly<PostPageTrackerProps>) {
  const {setCurrentPostId} = usePostNavigation()

  useEffect(() => {
    // Set current post when component mounts
    setCurrentPostId(postId)

    // Clear current post when component unmounts
    return () => {
      setCurrentPostId(null)
    }
  }, [postId, setCurrentPostId])

  // This component has no visual output
  return null
}
