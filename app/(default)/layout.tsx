'use client'

import {Header} from '@/components/Header/Header'
import {Sidebar} from '@/components/Sidebar/Sidebar'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {AppShell, Container} from '@mantine/core'
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
      header={{height: 84, collapsed: false}}
      footer={{collapsed: isMobile, height: 54}}
      navbar={{
        breakpoint: 'sm',
        collapsed: {mobile: !isNavbarCollapsed, desktop: !isNavbarCollapsed},
        width: 320
      }}
      padding="md"
    >
      <AppShell.Header p="md">
        <Header />
      </AppShell.Header>

      <AppShell.Navbar p="md" h="100%">
        <Sidebar />
      </AppShell.Navbar>

      <AppShell.Main pl="0" pr="0">
        <Container maw={700}>{children}</Container>
      </AppShell.Main>
    </AppShell>
  )
}
