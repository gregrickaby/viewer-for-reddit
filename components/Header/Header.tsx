'use client'

import icon from '@/app/icon.png'
import {Search} from '@/components/Search/Search'
import {Settings} from '@/components/Settings/Settings'
import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {Burger, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import classes from './Header.module.css'
import {Icons} from './Icons'

export function Header() {
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

  return (
    <div className={classes.header}>
      <div className={classes.branding}>
        <Burger
          aria-label="Toggle navigation menu"
          onClick={toggleNavbarHandler}
          opened={showNavbar}
          size="md"
        />
        <Link href="/">
          <Image alt="Logo" height={32} src={icon} width={32} priority />
        </Link>
        <Title visibleFrom="md">{config.siteName}</Title>
        <VisuallyHidden>{config.metaDescription}</VisuallyHidden>
      </div>
      <div className={classes.headerActions}>
        <Search />
        <div className={classes.icons}>
          <Settings />
          <Icons />
        </div>
      </div>
    </div>
  )
}
