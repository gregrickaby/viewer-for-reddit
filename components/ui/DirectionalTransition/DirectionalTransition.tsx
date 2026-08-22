import {ViewTransition} from 'react'

/**
 * Props for the DirectionalTransition component.
 */
interface DirectionalTransitionProps {
  /** Page content to animate */
  children: React.ReactNode
}

/**
 * Wraps a page's content so `<Link transitionTypes={['nav-forward' | 'nav-back']}>`
 * navigations slide the outgoing/incoming page horizontally. Any other
 * transition (e.g. a Suspense reveal) is unaffected since `default="none"`.
 * Place in page components only -- layouts persist across navigations and
 * never fire enter/exit.
 */
export function DirectionalTransition({
  children
}: Readonly<DirectionalTransitionProps>) {
  return (
    <ViewTransition
      enter={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        default: 'none'
      }}
      exit={{
        'nav-forward': 'nav-forward',
        'nav-back': 'nav-back',
        default: 'none'
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  )
}
