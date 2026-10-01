import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SettingSwitch } from '@/components/islands/setting-switch'
import { ThemeToggle } from '@/components/islands/theme-toggle'
import { PageTransition } from '@/components/motion/transitions'
import { BackLink } from '@/components/ui/back-link'
import { getSettings } from '@/lib/settings'
import styles from './page.module.css'

export const metadata: Metadata = { title: 'Settings' }

async function Controls() {
  const settings = await getSettings()
  return (
    <div className={styles.card}>
      <ThemeToggle theme={settings.theme} />
      <SettingSwitch
        checked={settings.blurNsfw}
        label="Blur NSFW media"
        description="Hides adult images and videos until you choose to show them. Spoilers are always hidden."
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className={styles.page}>
        <BackLink href="/home">Home</BackLink>
        <h1 className={styles.title}>Settings</h1>
        <Suspense fallback={<span className={`skeleton ${styles.skeleton}`} aria-busy="true" />}>
          <Controls />
        </Suspense>
      </div>
    </PageTransition>
  )
}
