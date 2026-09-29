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
        <h2 className={styles.title}>Settings</h2>
        <div className={styles.rows}>
          <ThemeToggle theme={settings.theme} />
          <SettingSwitch
            checked={settings.blurNsfw}
            label="Blur NSFW media"
            description="Hides adult images and videos until you choose to show them"
          />
        </div>
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
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  )
}

export function SettingsMenuSkeleton() {
  return <span className={`skeleton ${styles.skeleton}`} aria-hidden="true" />
}
