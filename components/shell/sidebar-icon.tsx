/* eslint-disable @next/next/no-img-element -- tiny Reddit-hosted icons; see components/media/post-media.tsx */
import styles from './sidebar.module.css'

export function SidebarIcon({ src, fallback }: { src: string | null; fallback: string }) {
  return src ? (
    <img
      alt=""
      className={styles.icon}
      decoding="async"
      height={20}
      loading="lazy"
      src={src}
      width={20}
    />
  ) : (
    <span aria-hidden="true" className={styles.iconFallback}>
      {fallback}
    </span>
  )
}
