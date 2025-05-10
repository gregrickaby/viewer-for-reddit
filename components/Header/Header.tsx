'use client'

import icon from '@/app/icon.png'
import {Search} from '@/components/Search/Search'
import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {Burger, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

  return (
    <>
      <div>
        <Burger
          aria-label="Toggle navigation menu"
          onClick={toggleNavbarHandler}
          opened={showNavbar}
          size="md"
        />
        <Link href="/">
          <Image alt="Logo" height={32} src={icon} width={32} />
        </Link>
        <Title visibleFrom="sm">{config.siteName}</Title>
        <VisuallyHidden>{config.metaDescription}</VisuallyHidden>
      </div>
      <Search />
    </>
  )
}
