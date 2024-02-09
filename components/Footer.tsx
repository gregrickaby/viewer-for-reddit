import config from '@/lib/config'

/**
 * The footer component.
 */
export default function Footer() {
  return (
    <footer className="text-center font-mono text-xs">
      <p>
        Website by{' '}
        <a
          aria-label={`visit ${config.siteAuthor} website`}
          href={config.authorUrl}
          rel="author"
        >
          {config.siteAuthor}
        </a>{' '}
        (
        <a
          aria-label="view source code on github"
          href={config.githubUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          view source code
        </a>
        )
      </p>
    </footer>
  )
}
