'use client'

import config from '@/lib/config'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {ActionIcon, Burger, Title, VisuallyHidden} from '@mantine/core'
import Image from 'next/image'
import Link from 'next/link'
import {FaSearch} from 'react-icons/fa'
import icon from '../app/icon.png'

/**
 * The header component.
 */
export function Header() {
  const {showNavbar, toggleNavbarHandler, toggleSearchHandler} =
    useHeaderState()

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
      <ActionIcon
        hiddenFrom="sm"
        variant="transparent"
        aria-label="Search"
        onClick={toggleSearchHandler}
      >
        <FaSearch size="32" />
      </ActionIcon>
    </>
  )
}
