'use client'

import {HeaderIcons} from '@/components/Header/HeaderIcons'
import {Search} from '@/components/Search/Search'
import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {Burger, Group, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import icon from '../app/icon.png'
import classes from './Header.module.css'

export function Header() {
  const {showNavbar, toggleNavbarHandler} = useHeaderState()

  return (
    <div className={classes.header}>
      <div className={classes.headerLeft}>
        <Burger
          aria-label="Toggle navigation menu"
          onClick={toggleNavbarHandler}
          opened={showNavbar}
          size="lg"
        />
        <Link href="/" onClick={showNavbar ? toggleNavbarHandler : undefined}>
          <Group>
            <Image alt="Logo" height={38} src={icon} width={38} priority />
            <Title visibleFrom="md">{config.siteName}</Title>
          </Group>
        </Link>
        <VisuallyHidden>{config.metaDescription}</VisuallyHidden>
      </div>
      <div className={classes.headerRight}>
        <Search />
        <HeaderIcons />
      </div>
    </div>
  )
}
