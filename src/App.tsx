import React, { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Controls } from './components/Controls'
import { ErrorFallback } from './components/ErrorFallback'
import { Feed } from './components/Feed'
import { Modal } from './components/Modal'
import { Search } from './components/Search'
import { IconSpinner } from './icons/Spinner'
import {
  toggleAbout,
  toggleFavorites,
  toggleRecent,
  toggleSearch,
  toggleSettings
} from './store/features/settingsSlice'
import { useAppDispatch, useAppSelector } from './store/hooks'
import type { RootState } from './store/store'

// Lazy-load the About and Settings components to reduce the initial bundle size.
const About = React.lazy(() => import('./components/About'))
const Recent = React.lazy(() => import('./components/Recent'))
const Settings = React.lazy(() => import('./components/Settings'))
const Favorites = React.lazy(() => import('./components/Favorites'))

/**
 * Main App Component
 *
 * This component sets up the primary layout of the application. It renders the main feed,
 * and it conditionally displays modals for settings, search, and about information.
 *
 * The Feed component is wrapped in an ErrorBoundary to catch and display errors using an ErrorFallback.
 * The Settings and About modals are lazy-loaded via React.lazy and Suspense, so they are only loaded
 * when needed, which improves initial load performance.
 */
export default function App() {
  // Get the dispatch function.
  const dispatch = useAppDispatch()

  // Select modal visibility states from the Redux store.
  const { showSettings, showSearch, showAbout, showRecent, showFavorites } =
    useAppSelector((state: RootState) => state.settings)

  return (
    <>
      {/* Create the TikTok-style layout with snapping and smooth scrolling. */}
      <main className="h-screen w-full snap-y snap-mandatory overflow-x-hidden overflow-y-scroll overscroll-contain scroll-smooth dark:bg-zinc-900">
        {/* The ErrorBoundary catches errors in the Feed component and renders ErrorFallback if necessary. */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Feed />
        </ErrorBoundary>
      </main>

      <Controls />

      {/* Search Modal. */}
      <Modal
        isOpen={showSearch}
        onClose={function handleCloseSearch() {
          dispatch(toggleSearch())
        }}
        title="Search"
      >
        <Search />
      </Modal>

      {/* Recent Modal. */}
      <Modal
        isOpen={showRecent}
        onClose={function handleCloseRecent() {
          dispatch(toggleRecent())
        }}
        title="Viewing History"
      >
        <Recent />
      </Modal>

      {/* Favorites Modal. */}
      <Modal
        isOpen={showFavorites}
        onClose={function handleCloseFavorites() {
          dispatch(toggleFavorites())
        }}
        title="Favorites"
      >
        <Favorites />
      </Modal>

      {/* Settings Modal. */}
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

      {/* About Modal. */}
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
