import {Title} from '@mantine/core'
import classes from '~/components/Header.module.css'
import config from '~/lib/config'

/**
 * Header component.
 */
export default function Header() {
  return (
    <header className={classes.header}>
      <Title className={classes.title} order={1}>
        {config.siteName}
      </Title>
      <Title className={classes.description} order={2}>
        {config.siteDescription}
      </Title>
    </header>
  )
}
