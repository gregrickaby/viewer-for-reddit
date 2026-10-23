import { ViewTransition, type ReactNode } from 'react'

/*
 * Motion primitives. All are Server Components: `<ViewTransition>`
 * needs no client code. `default="none"` keeps each one out of unrelated transitions.
 */

const DIRECTIONAL = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

/** Slides a page in the direction of travel. Goes in each page, never a layout. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter={DIRECTIONAL} exit={DIRECTIONAL}>
      {children}
    </ViewTransition>
  )
}

/** Wraps a Suspense fallback: the skeleton slides down and out when data arrives. */
export function SkeletonExit({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" exit="slide-down">
      {children}
    </ViewTransition>
  )
}

/** Wraps Suspense content: it slides up into place. */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter="slide-up">
      {children}
    </ViewTransition>
  )
}

/** Crossfades same-route changes (sort, page) when `contentKey` changes. */
export function ContentReveal({
  contentKey,
  name,
  children,
}: {
  contentKey: string
  name: string
  children: ReactNode
}) {
  return (
    <ViewTransition default="none" enter="auto" key={contentKey} name={name} share="auto">
      {children}
    </ViewTransition>
  )
}
