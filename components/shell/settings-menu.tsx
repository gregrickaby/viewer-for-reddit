import { SettingSwitch } from '@/components/islands/setting-switch'
import { ThemeToggle } from '@/components/islands/theme-toggle'
import { getSettings } from '@/lib/settings'
import styles from './settings-menu.module.css'

/**
 * The gear in the header's top right: theme and "Blur NSFW media" (design
 * §8.8). A native popover, so it opens without JavaScript. It reads cookies,
 * so it streams in behind a Suspense boundary.
 */
export async function SettingsMenu() {
  const settings = await getSettings()
  return (
    <div className={styles.root}>
      <GearButton />
      <div id="settings-menu" popover="auto" className={styles.menu}>
        <ThemeToggle theme={settings.theme} />
        <SettingSwitch checked={settings.blurNsfw} label="Blur NSFW media" />
      </div>
    </div>
  )
}

function GearButton() {
  return (
    <button
      type="button"
      className={styles.trigger}
      popoverTarget="settings-menu"
      aria-label="Settings"
    >
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="2.6" />
        <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
      </svg>
    </button>
  )
}

export function SettingsMenuSkeleton() {
  return <span className={`skeleton ${styles.skeleton}`} aria-hidden="true" />
}
