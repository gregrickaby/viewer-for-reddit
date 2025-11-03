'use client'

import {Header} from '@/components/Layout/Header/Header'
import {Sidebar} from '@/components/Layout/Sidebar/Sidebar'
import {useHeaderState} from '@/lib/hooks/ui/useHeaderState'
import {AppShell, Container} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {Suspense} from 'react'

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
      padding={0}
    >
      <AppShell.Header p="md">
        <Suspense fallback={<div>Loading...</div>}>
          <Header />
        </Suspense>
      </AppShell.Header>

      <AppShell.Navbar p="md" h="100%">
        <Suspense fallback={<div>Loading...</div>}>
          <Sidebar />
        </Suspense>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container maw={700} mt="lg">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
