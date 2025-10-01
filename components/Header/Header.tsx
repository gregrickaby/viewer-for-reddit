'use client'

import {HeaderIcons} from '@/components/Header/HeaderIcons'
import {UserMenu} from '@/components/Header/UserMenu'
import {Search} from '@/components/Search/Search'
import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {Burger, Group, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import classes from './Header.module.css'

export function Header() {
  const {showNavbar, toggleNavbarHandler} = useHeaderState()
  const {setQuery} = useSubredditSearch()

  /**
   * When clicking the logo, clear the search query.
   */
  const onClickHandler = () => {
    setQuery('')
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
            <Image alt="Logo" height={38} src="/icon.png" width={38} priority />
            <Title visibleFrom="md">{config.siteName}</Title>
          </Group>
        </Link>
        <VisuallyHidden>{config.metaDescription}</VisuallyHidden>
      </div>
      <div className={classes.headerRight}>
        <Search />
        <HeaderIcons />
        <UserMenu />
      </div>
    </div>
  )
}
