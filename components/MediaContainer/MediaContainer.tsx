import clsx from 'clsx'
import {ReactNode} from 'react'
import styles from './MediaContainer.module.css'

interface MediaContainerProps {
  children: ReactNode
  isVertical?: boolean
}

export function MediaContainer({
  children,
  isVertical
}: Readonly<MediaContainerProps>) {
  return (
    <div
      className={clsx(
        styles.container,
        isVertical ? styles.vertical : styles.horizontal
      )}
    >
      {children}
    </div>
  )
}
