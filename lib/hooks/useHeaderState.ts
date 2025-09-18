'use client'

import {
  selectNavbar,
  selectSearch,
  toggleNavbar,
  toggleSearch
} from '@/lib/store/features/transientSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'

export function useHeaderState() {
  const dispatch = useAppDispatch()
  const showNavbar = useAppSelector(selectNavbar)
  const showSearch = useAppSelector(selectSearch)

  const toggleNavbarHandler = () => dispatch(toggleNavbar())
  const toggleSearchHandler = () => dispatch(toggleSearch())

  return {showNavbar, toggleNavbarHandler, showSearch, toggleSearchHandler}
}
