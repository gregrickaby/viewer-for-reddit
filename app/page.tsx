'use client'

import { Controls, ErrorFallback, Feed, Modal, Search } from '@/components'
import { IconSpinner } from '@/icons/Spinner'
import {
  toggleAbout,
  toggleFavorites,
  toggleRecent,
  toggleSearch,
  toggleSettings
} from '@/lib/features/transientSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import type { RootState } from '@/lib/store'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Lazy-load components to reduce the initial bundle size.
const About = dynamic(() => import('@/components/About'))
const Recent = dynamic(() => import('@/components/Recent'))
const Settings = dynamic(() => import('@/components/Settings'))
const Favorites = dynamic(() => import('@/components/Favorites'))

/**
 * Home component.
 */
export default function Home() {
  // Get the dispatch function.
  const dispatch = useAppDispatch()

  // Select modal visibility states from the Redux store.
  const { showSettings, showSearch, showAbout, showRecent, showFavorites } =
    useAppSelector((state: RootState) => state.transient)

  return (
    <>
      {/* Create the TikTok-style layout with snapping and smooth scrolling */}
      <main className="h-screen w-full snap-y snap-mandatory overflow-x-hidden overflow-y-scroll overscroll-contain scroll-smooth dark:bg-zinc-900">
        {/* The ErrorBoundary catches errors in the Feed component and renders ErrorFallback if necessary */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Feed />
        </ErrorBoundary>
      </main>

      <Controls />

      {/* Search Modal */}
      <Modal
        isOpen={showSearch}
        onClose={function handleCloseSearch() {
          dispatch(toggleSearch())
        }}
        title="Search"
      >
        <Search />
      </Modal>

      {/* Recent Modal */}
      <Modal
        isOpen={showRecent}
        onClose={function handleCloseRecent() {
          dispatch(toggleRecent())
        }}
        title="Viewing History"
      >
        <Recent />
      </Modal>

      {/* Favorites Modal */}
      <Modal
        isOpen={showFavorites}
        onClose={function handleCloseFavorites() {
          dispatch(toggleFavorites())
        }}
        title="Favorites"
      >
        <Favorites />
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={function handleCloseSettings() {
          dispatch(toggleSettings())
        }}
        title="Settings"
      >
        <Suspense fallback={<IconSpinner />}>
          <Settings />
        </Suspense>
      </Modal>

      {/* About Modal */}
      <Modal
        isOpen={showAbout}
        onClose={function handleCloseAbout() {
          dispatch(toggleAbout())
        }}
        title="About Reddit Viewer"
      >
        <Suspense fallback={<IconSpinner />}>
          <About />
        </Suspense>
      </Modal>
    </>
  )
}
