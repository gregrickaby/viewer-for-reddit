import {createStyles} from '@mantine/core'
import {IconBrandGithub} from '@tabler/icons-react'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  footer: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: theme.fontFamilyMonospace,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',

    p: {
      marginBottom: 0
    },

    a: {
      color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,

      '&:hover': {
        textDecoration: 'none'
      }
    }
  }
}))

/**
 * Footer component.
 */
export default function Footer() {
  const {classes} = useStyles()
  return (
    <footer className={classes.footer}>
      <p>
        website by{' '}
        <a
          aria-label={`visit ${config.siteAuthor} website`}
          href={config.authorUrl}
          rel="author"
        >
          {config.siteAuthor}
        </a>
      </p>
      <p>
        <a
          aria-label="view source code on github"
          href={config.githubUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <IconBrandGithub />
        </a>
      </p>
    </footer>
  )
}
