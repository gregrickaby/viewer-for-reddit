import type {ManagedMultireddit} from '@/lib/hooks/useMultiredditManager'
import type {ManagedSubscription} from '@/lib/hooks/useSubredditManager'
import {Header} from '@/components/layout/Header/Header'
import {SidebarProvider} from '@/components/layout/Sidebar/SidebarContext'
import {SidebarPanel} from '@/components/layout/Sidebar/SidebarPanel'
import styles from './Shell.module.css'

interface ShellProps {
  children: React.ReactNode
  username?: string
  avatarUrl?: string
  subscriptions?: ManagedSubscription[]
  multireddits?: ManagedMultireddit[]
  following?: Array<{
    name: string
    id: string
    date: number
    note?: string
  }>
}

/** Server-rendered application shell with header, sidebar, and main content area. */
export function Shell({
  children,
  username,
  avatarUrl,
  subscriptions,
  multireddits,
  following
}: Readonly<ShellProps>) {
  return (
    <SidebarProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Header username={username} avatarUrl={avatarUrl} />
        </header>

        <SidebarPanel
          username={username}
          subscriptions={subscriptions}
          multireddits={multireddits}
          following={following}
        />

        <main className={styles.main}>{children}</main>
      </div>
    </SidebarProvider>
  )
}
