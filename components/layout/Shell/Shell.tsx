import {Header} from '@/components/layout/Header/Header'
import {SidebarProvider} from '@/components/layout/Sidebar/SidebarContext'
import styles from './Shell.module.css'

interface ShellProps {
  children: React.ReactNode
  /**
   * The sidebar's personalized content, pre-wrapped by the caller in its own
   * `<Suspense>`. Kept as a slot (not fetched here) so this component stays
   * fully static -- only the slot's own boundary defers to request time.
   */
  sidebarSlot: React.ReactNode
}

/** Server-rendered application shell with header, sidebar, and main content area. */
export function Shell({children, sidebarSlot}: Readonly<ShellProps>) {
  return (
    <SidebarProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Header />
        </header>

        {sidebarSlot}

        <main className={styles.main}>{children}</main>
      </div>
    </SidebarProvider>
  )
}
