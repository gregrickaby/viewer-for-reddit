import Link, { type LinkProps } from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
}

function classes({ variant = 'primary', size = 'md', className }: Omit<CommonProps, 'children'>) {
  return [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')
}

export function Button({
  variant,
  size,
  className,
  children,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes({ variant, size, className })} {...rest}>
      {children}
    </button>
  )
}

export function LinkButton<Href extends string>({
  variant,
  size,
  className,
  children,
  ...rest
}: CommonProps & LinkProps<Href>) {
  return (
    <Link className={classes({ variant, size, className })} {...rest}>
      {children}
    </Link>
  )
}
