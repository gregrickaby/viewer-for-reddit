import {createStyles} from '@mantine/core'
import config from '~/lib/config'

interface Props {
  setSearchState: React.Dispatch<React.SetStateAction<string>>
  searchState: string
}

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
    cursor: 'pointer',
    margin: 0,
    [`@media (max-width: ${theme.breakpoints.sm}px)`]: {
      lineHeight: 1
    }
  }
}))

export default function Header({setSearchState, searchState}: Props) {
  const {classes} = useStyles()

  const handleClick = () => {
    setSearchState('')
  }

  return (
    <header className={classes.header}>
      <h1 onClick={handleClick} className={classes.title}>
        {config.siteTitle}
      </h1>
      <p>{config.siteDescription}</p>
    </header>
  )
}
