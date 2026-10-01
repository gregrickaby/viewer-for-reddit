/* eslint-disable @next/next/no-img-element -- tiny Reddit-hosted icons; see components/media/post-media.tsx */
import styles from './sidebar.module.css'

export function SidebarIcon({ src, fallback }: { src: string | null; fallback: string }) {
  return src ? (
    <img
      className={styles.icon}
      src={src}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className={styles.iconFallback} aria-hidden="true">
      {fallback}
    </span>
  )
}
