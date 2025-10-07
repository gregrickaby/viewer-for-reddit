'use client'

import {Header} from '@/components/Layout/Header/Header'
import {Sidebar} from '@/components/Layout/Sidebar/Sidebar'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {AppShell, Container} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'

/**
 * The client-side layout component with the AppShell.
 */
export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const {showNavbar} = useHeaderState()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <AppShell
      header={{height: 84, collapsed: false}}
      footer={{collapsed: isMobile, height: 54}}
      navbar={{
        breakpoint: 'md',
        collapsed: {
          mobile: !showNavbar, // Mobile: overlay behavior
          desktop: !showNavbar // Desktop: push behavior
        },
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

      <AppShell.Main>
        <Container maw={700} px="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
