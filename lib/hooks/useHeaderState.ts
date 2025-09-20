'use client'

import {
  selectMobileSearchState,
  selectNavbar,
  setMobileSearchState,
  toggleNavbar
} from '@/lib/store/features/transientSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'

export function useHeaderState() {
  const dispatch = useAppDispatch()
  const showNavbar = useAppSelector(selectNavbar)
  const mobileSearchState = useAppSelector(selectMobileSearchState)

  // Derive boolean state for backwards compatibility
  const showSearch =
    mobileSearchState === 'open' || mobileSearchState === 'opening'

  const toggleNavbarHandler = () => dispatch(toggleNavbar())
  const toggleSearchHandler = () => {
    if (showSearch) {
      dispatch(setMobileSearchState('closed'))
    } else {
      dispatch(setMobileSearchState('open'))
    }
  }

  return {showNavbar, toggleNavbarHandler, showSearch, toggleSearchHandler}
}
