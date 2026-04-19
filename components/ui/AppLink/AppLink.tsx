import NextLink from 'next/link'
import type {ComponentPropsWithoutRef} from 'react'
import classes from './AppLink.module.css'

type AppLinkProps = ComponentPropsWithoutRef<typeof NextLink>

/**
 * A styled wrapper around `next/link` that inherits the current text color
 * and removes the default underline decoration. Accepts all `next/link` props.
 */
export function AppLink({className, ...props}: Readonly<AppLinkProps>) {
  return (
    <NextLink
      className={[classes.appLink, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
