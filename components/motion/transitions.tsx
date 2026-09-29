import { type ReactNode, ViewTransition } from 'react'

/*
 * Motion primitives (design §8.5). All are Server Components: `<ViewTransition>`
 * needs no client code. `default="none"` keeps each one out of unrelated transitions.
 */

const DIRECTIONAL = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }

/** Slides a page in the direction of travel. Goes in each page, never a layout. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={DIRECTIONAL} exit={DIRECTIONAL} default="none">
      {children}
    </ViewTransition>
  )
}

/** Wraps a Suspense fallback: the skeleton slides down and out when data arrives. */
export function SkeletonExit({ children }: { children: ReactNode }) {
  return (
    <ViewTransition exit="slide-down" default="none">
      {children}
    </ViewTransition>
  )
}

/** Wraps Suspense content: it slides up into place. */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="slide-up" default="none">
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
    <ViewTransition key={contentKey} name={name} share="auto" enter="auto" default="none">
      {children}
    </ViewTransition>
  )
}
