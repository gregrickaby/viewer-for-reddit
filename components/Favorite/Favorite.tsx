'use client'

import {useToggleFavorite} from '@/lib/hooks/useToggleFavorite'
import {ActionIcon} from '@mantine/core'
import {FaHeart, FaRegHeart} from 'react-icons/fa'

interface FavoriteProps {
  subreddit: string
}

export function Favorite({subreddit}: Readonly<FavoriteProps>) {
  const {isFavorite, loading, toggle} = useToggleFavorite(subreddit)

  return (
    <ActionIcon
      aria-label="Toggle favorite"
      disabled={loading}
      loading={loading}
      onClick={toggle}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      size="lg"
    >
      {isFavorite ? <FaHeart /> : <FaRegHeart />}
    </ActionIcon>
  )
}
