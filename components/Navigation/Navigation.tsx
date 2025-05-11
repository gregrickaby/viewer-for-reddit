'use client'

import {
  clearSingleFavorite,
  clearSingleRecent
} from '@/lib/store/features/settingsSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {ActionIcon} from '@mantine/core'
import {useMounted} from '@mantine/hooks'
import {showNotification} from '@mantine/notifications'
import Link from 'next/link'
import {FaTrashAlt} from 'react-icons/fa'

export function Navigation() {
  const mounted = useMounted()
  const dispatch = useAppDispatch()
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
                <ActionIcon
                  aria-label="Delete from favorites"
                  onClick={() => {
                    dispatch(clearSingleFavorite(sub.display_name))
                    showNotification({
                      title: 'Deleted',
                      message: `r/${sub.display_name} was deleted from your favorites.`
                    })
                  }}
                >
                  <FaTrashAlt />
                </ActionIcon>
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
                <ActionIcon
                  aria-label="Delete from favorites"
                  onClick={() => {
                    dispatch(clearSingleRecent(sub.display_name))
                    showNotification({
                      title: 'Deleted',
                      message: `r/${sub.display_name} has been deleted from recent viewing history.`
                    })
                  }}
                >
                  <FaTrashAlt />
                </ActionIcon>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
