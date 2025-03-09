import { ReactNode } from 'react'

/**
 * Tooltip Props.
 */
interface TooltipProps {
  /* Label for the tooltip. */
  label: string
  /* Children components. */
  children: ReactNode
}

/**
 * Tooltip Component.
 */
export function Tooltip({ label, children }: Readonly<TooltipProps>) {
  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-active:opacity-100 md:group-hover:opacity-100">
        <div className="rounded bg-black/75 px-2 py-1 text-center text-xs text-white">
          {label}
        </div>
        <div className="absolute top-full left-1/2 -mt-px -translate-x-1/2 border-4 border-transparent border-t-black/75" />
      </div>
    </div>
  )
}
