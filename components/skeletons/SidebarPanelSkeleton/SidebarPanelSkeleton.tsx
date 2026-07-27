import shellStyles from '@/components/layout/Shell/Shell.module.css'
import {Skeleton, Stack} from '@mantine/core'

/**
 * Suspense fallback for {@link AuthenticatedSidebarPanel}. Reuses Shell's
 * own `.sidebar` grid area (same CSS module) so there's no layout shift when
 * the real sidebar swaps in.
 */
export function SidebarPanelSkeleton() {
  return (
    <aside className={shellStyles.sidebar}>
      <Stack gap="md">
        <Skeleton height={36} />
        <Skeleton height={36} />
        <Skeleton height={36} />
      </Stack>
    </aside>
  )
}
