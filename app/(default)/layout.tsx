'use client'

import {Footer} from '@/components/Footer/Footer'
import {Header} from '@/components/Header/Header'
import {Sidebar} from '@/components/Sidebar/Sidebar'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {AppShell} from '@mantine/core'
import {useViewportSize} from '@mantine/hooks'

/**
 * The client-side layout component with the AppShell.
 */
export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const {showNavbar: isNavbarCollapsed} = useHeaderState()

  const isMobile = useViewportSize().width < 480

  return (
    <AppShell
      header={{height: 68}}
      footer={{collapsed: isMobile, height: 54}}
      navbar={{
        breakpoint: 'sm',
        collapsed: {mobile: !isNavbarCollapsed, desktop: !isNavbarCollapsed},
        width: 300
      }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Header />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <AppShell.Footer p="md">
        <Footer />
      </AppShell.Footer>
    </AppShell>
  )
}
