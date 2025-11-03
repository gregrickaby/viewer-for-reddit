'use server'

import {authenticatedFetch} from '@/lib/utils/api/fetching/authenticatedFetch'

/**
 * Server Action: Get current authenticated user's data.
 * Can be called from Server Components or client components.
 *
 * @example Server Component
 * ```tsx
 * export default async function ProfilePage() {
 *   const user = await getUserData()
 *   if (!user) {
 *     redirect('/api/auth/login')
 *   }
 *   return <div>Welcome {user.name}</div>
 * }
 * ```
 *
 * @example Client Component
 * ```tsx
 * 'use client'
 * export function UserProfile() {
 *   const [user, setUser] = useState(null)
 *
 *   useEffect(() => {
 *     getUserData().then(setUser)
 *   }, [])
 * }
 * ```
 */
export async function getUserData() {
  const data = await authenticatedFetch<{
    name: string
    id: string
    icon_img?: string
    snoovatar_img?: string
    link_karma: number
    comment_karma: number
    created_utc: number
  }>('/api/v1/me')

  return data
}

/**
 * Server Action: Get user's subscribed subreddits.
 */
export async function getUserSubscriptions() {
  const data = await authenticatedFetch<{
    data: {
      children: Array<{
        data: {
          display_name: string
          icon_img?: string
          subscribers: number
        }
      }>
    }
  }>('/subreddits/mine/subscriber?limit=100')

  return data?.data?.children || []
}

/**
 * Server Action: Get user's home feed.
 */
export async function getUserHomeFeed(params?: {
  after?: string
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.after) searchParams.set('after', params.after)
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const query = searchParams.toString()
  const endpoint = query ? `/best?${query}` : '/best'

  const data = await authenticatedFetch<{
    data: {
      children: any[]
      after: string | null
    }
  }>(endpoint)

  return data?.data || {children: [], after: null}
}
