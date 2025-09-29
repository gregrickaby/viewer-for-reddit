'use client'

import {
  selectMobileSearchState,
  selectNavbar,
  setMobileSearchState,
  toggleNavbar
} from '@/lib/store/features/transientSlice'
import {useAppDispatch, useAppSelector} from '@/lib/store/hooks'
import {useMediaQuery} from '@mantine/hooks'

export function useHeaderState() {
  const dispatch = useAppDispatch()
  const showNavbar = useAppSelector(selectNavbar)
  const mobileSearchState = useAppSelector(selectMobileSearchState)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const showSearch =
    mobileSearchState === 'open' || mobileSearchState === 'opening'

  /**
   * Toggle the navbar open/closed state.
   */
  const toggleNavbarHandler = () => dispatch(toggleNavbar())

  /**
   * On Mobile, closing the navbar when navigating to a new page.
   */
  const toggleNavbarOnMobileHandler = () => {
    if (isMobile && showNavbar) {
      dispatch(toggleNavbar())
    }
  }

  /**
   * Toggle the mobile search open/closed state.
   */
  const toggleSearchHandler = () => {
    if (showSearch) {
      dispatch(setMobileSearchState('closed'))
    } else {
      dispatch(setMobileSearchState('open'))
    }
  }

  return {
    showNavbar,
    toggleNavbarHandler,
    toggleNavbarOnMobileHandler,
    showSearch,
    toggleSearchHandler,
    isMobile
  }
}
