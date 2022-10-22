import {createStyles} from '@mantine/core'
import {IconBrandGithub} from '@tabler/icons'
import config from '~/lib/config'

const useStyles = createStyles((theme) => ({
  footer: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing.md,
    justifyContent: 'center',
    textAlign: 'center',

    a: {
      color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black
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
        <a href={config.authorUrl} target="_blank" rel="noopener noreferrer">
          {config.siteAuthor}
        </a>
      </p>
      <p>
        <a
          href="https://github.com/gregrickaby/reddit-image-viewer"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconBrandGithub />
        </a>
      </p>
    </footer>
  )
}
