'use client'

import {Search} from '@/components/Search/Search'
import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {Box, Burger, Group, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import Snoo from '../../app/icon.png'
import classes from './Header.module.css'
import {HeaderIcons} from './HeaderIcons'

/**
 * Header component using Mantine layout primitives.
 */
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
    <Group px="md" gap="md" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger
          aria-label="Toggle navigation menu"
          onClick={toggleNavbarHandler}
          opened={showNavbar}
        />
        <Link className={classes.headerLink} href="/" onClick={onClickHandler}>
          <Group gap="xs" wrap="nowrap">
            <Image alt="Logo" height={38} src={Snoo} width={38} priority />
            <Title size="h4" visibleFrom="md">
              {config.siteName}
            </Title>
          </Group>
        </Link>
        <VisuallyHidden>{config.metaDescription}</VisuallyHidden>
      </Group>

      <Box visibleFrom="md" className={classes.searchContainer}>
        <Search />
      </Box>

      <Group gap="xs" wrap="nowrap">
        <Box hiddenFrom="md">
          <Search />
        </Box>
        <HeaderIcons />
      </Group>
    </Group>
  )
}
