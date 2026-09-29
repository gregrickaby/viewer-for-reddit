import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SettingSwitch } from '@/components/islands/setting-switch'
import { ThemeToggle } from '@/components/islands/theme-toggle'
import { PageTransition } from '@/components/motion/transitions'
import { getSettings } from '@/lib/settings'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Settings' }

async function Controls() {
  const settings = await getSettings()
  return (
    <>
      <section className={styles.setting} aria-labelledby="theme-heading">
        <h2 id="theme-heading" className={styles.heading}>
          Theme
        </h2>
        <p className={styles.help}>System follows your device. Saved on this browser for a year.</p>
        <ThemeToggle theme={settings.theme} />
      </section>
      <section className={styles.setting} aria-labelledby="blur-heading">
        <h2 id="blur-heading" className={styles.heading}>
          NSFW media
        </h2>
        <p className={styles.help}>
          When on, NSFW images and videos stay blurred until you choose to show them, and nothing
          loads before that. Spoilers are always hidden. Saved on this browser for a year.
        </p>
        <SettingSwitch checked={settings.blurNsfw} label="Blur NSFW media" />
      </section>
    </>
  )
}

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <h1 className={styles.title}>Settings</h1>
        <Suspense fallback={<span className={`skeleton ${styles.skeleton}`} aria-busy="true" />}>
          <Controls />
        </Suspense>
      </div>
    </PageTransition>
  )
}
