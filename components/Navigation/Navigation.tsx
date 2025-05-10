'use client'

import {useAppSelector} from '@/lib/store/hooks'
import {useMounted} from '@mantine/hooks'
import Link from 'next/link'

export function Navigation() {
  const mounted = useMounted()
  const recent = useAppSelector((state) => state.settings.recent)
  const favorites = useAppSelector((state) => state.settings.favorites)

  if (!mounted) return null

  return (
    <nav>
      {favorites.length > 0 && (
        <div>
          <h2>Favorites</h2>
          <ul>
            {favorites.map((sub) => (
              <li key={sub.display_name}>
                <Link href={`/r/${sub.display_name}`}>{sub.display_name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h2>Recent</h2>
          <ul>
            {recent.map((sub) => (
              <li key={sub.display_name}>
                <Link href={`/r/${sub.display_name}`}>{sub.display_name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
