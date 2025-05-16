'use client'

import {
  addRecentSubreddit,
  setCurrentSubreddit
} from '@/lib/store/features/settingsSlice'
import {useAppDispatch} from '@/lib/store/hooks'
import {useEffect} from 'react'

export function useTrackRecentSubreddit(subreddit: string) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!subreddit.trim()) return

    dispatch(
      addRecentSubreddit({
        display_name: subreddit,
        icon_img: '',
        subscribers: 0,
        over18: false,
        value: subreddit
      })
    )

    dispatch(setCurrentSubreddit(subreddit))
  }, [subreddit, dispatch])
}
