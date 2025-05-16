'use client'

import {useToggleFavorite} from '@/lib/hooks/useToggleFavorite'
import {ActionIcon, Tooltip} from '@mantine/core'
import {FaHeart, FaRegHeart} from 'react-icons/fa'

interface FavoriteProps {
  subreddit: string
}

export function Favorite({subreddit}: Readonly<FavoriteProps>) {
  const {isFavorite, loading, toggle} = useToggleFavorite(subreddit)

  if (subreddit === 'all' || subreddit === 'popular') return null

  const label = isFavorite ? 'Remove from favorites' : 'Add to favorites'
  const icon = isFavorite ? <FaHeart /> : <FaRegHeart />
  const color = isFavorite ? 'red' : 'gray'

  return (
    <Tooltip label={label} position="right" withArrow>
      <ActionIcon
        aria-label={label}
        color={color}
        disabled={loading}
        loading={loading}
        onClick={toggle}
        size="lg"
        title={label}
        variant="subtle"
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  )
}
