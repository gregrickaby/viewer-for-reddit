'use client'

import {fetchUserInfo} from '@/lib/actions/reddit/users'
import {useEffect, useRef, useState, type RefObject} from 'react'

const avatarCache = new Map<string, string | null>()
const pendingFetches = new Map<string, Promise<string | null>>()

async function resolveAvatar(username: string): Promise<string | null> {
  const cached = avatarCache.get(username)
  if (cached !== undefined) return cached

  let pending = pendingFetches.get(username)
  if (!pending) {
    pending = fetchUserInfo(username)
      .then((user) => user.icon_img || null)
      .catch(() => null)
    pendingFetches.set(username, pending)
  }

  const avatarUrl = await pending
  avatarCache.set(username, avatarUrl)
  pendingFetches.delete(username)
  return avatarUrl
}

export interface UseUserAvatarResult {
  /** Resolved avatar URL, or null while loading, unavailable, or not yet visible. */
  avatarUrl: string | null
  /** Attach to the container element that should trigger the lazy fetch once visible. */
  ref: RefObject<HTMLDivElement | null>
}

/**
 * Lazily resolves a Reddit user's avatar URL once its container scrolls into
 * view, via IntersectionObserver. Results are cached in module scope across
 * every hook instance for the lifetime of the page, so a user who comments
 * repeatedly in the same thread only triggers one `fetchUserInfo` call.
 *
 * @param username - Reddit username to resolve, or null to skip fetching entirely.
 */
export function useUserAvatar(username: string | null): UseUserAvatarResult {
  const ref = useRef<HTMLDivElement | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    // Read the cache only after mount, never during the initial render -
    // SSR always starts with an empty cache, so reading it synchronously
    // in useState's initializer would mismatch the server-rendered HTML
    // whenever the client's module-scope cache is already warm.
    const cached = avatarCache.get(username)
    if (cached !== undefined) {
      setAvatarUrl(cached)
      return
    }

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()
        resolveAvatar(username).then(setAvatarUrl)
      },
      {threshold: 0.1}
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [username])

  return {avatarUrl, ref}
}
