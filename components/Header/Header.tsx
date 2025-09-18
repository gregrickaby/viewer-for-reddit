'use client'

import {HeaderIcons} from '@/components/Header/HeaderIcons'
import {Search} from '@/components/Search/Search'
import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {Burger, Group, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import Snoo from '../../app/icon.png'
import classes from './Header.module.css'

export function Header() {
  const {showNavbar, toggleNavbarHandler} = useHeaderState()
  const {setQuery} = useSubredditSearch()

  const onClickHandler = () => {
    // Always reset search query when clicking home
    setQuery('')
    // Close navbar if it's open
    if (showNavbar) {
      toggleNavbarHandler()
    }
  }

  return (
    <div className={classes.header}>
      <div className={classes.headerLeft}>
        <Burger
          aria-label="Toggle navigation menu"
          onClick={toggleNavbarHandler}
          opened={showNavbar}
        />
        <Link href="/" onClick={onClickHandler}>
          <Group>
            <Image alt="Logo" height={38} src={Snoo} width={38} priority />
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
