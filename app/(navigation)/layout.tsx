import {PostNavigationProvider} from '@/lib/contexts/PostNavigationContext'

/**
 * Navigation layout - wraps pages that need swipe navigation.
 *
 * This layout provides PostNavigationContext only to pages that need it,
 * avoiding unnecessary re-renders on pages without navigation (homepage, about).
 *
 * Pages under this layout:
 * - Subreddit pages (/r/[subreddit])
 * - Post pages (/r/[subreddit]/comments/[postId])
 * - User profile pages (/u/[username])
 * - Search pages (/search/[query])
 * - Multireddit pages (/user/[username]/m/[multiname])
 * - Saved posts (/user/[username]/saved)
 */
export default function NavigationLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return <PostNavigationProvider>{children}</PostNavigationProvider>
}
