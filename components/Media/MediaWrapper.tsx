import styles from './MediaWrapper.module.css'

interface MediaWrapperProps {
  isVertical: boolean
  children: React.ReactNode
}

export function MediaWrapper({
  isVertical,
  children
}: Readonly<MediaWrapperProps>) {
  return (
    <div
      className={`${styles.wrapper} ${isVertical ? styles.vertical : styles.horizontal}`}
    >
      {children}
    </div>
  )
}
