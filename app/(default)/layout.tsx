'use client'

import {Header} from '@/components/Header/Header'
import {Navigation} from '@/components/Navigation/Navigation'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {AppShell} from '@mantine/core'
import styles from './layout.module.css'

/**
 * The client-side layout component with the AppShell.
 */
export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const {showNavbar: isNavbarCollapsed} = useHeaderState()

  return (
    <AppShell
      header={{height: 68}}
      navbar={{
        breakpoint: 'sm',
        collapsed: {mobile: !isNavbarCollapsed, desktop: !isNavbarCollapsed},
        width: 300
      }}
      padding="md"
    >
      <AppShell.Header p="md" className={styles.header}>
        <Header />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Navigation />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
