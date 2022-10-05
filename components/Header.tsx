import {createStyles} from '@mantine/core'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      flexDirection: 'column',
      textAlign: 'center'
    }
  },
  title: {
    fontSize: theme.fontSizes.xl,
    margin: 0,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      lineHeight: 1
    }
  }
}))

export default function Header() {
  const {classes} = useStyles()
  return (
    <header className={classes.header}>
      <h1 className={classes.title}>{config.siteTitle}</h1>
      <p>{config.siteDescription}</p>
    </header>
  )
}
