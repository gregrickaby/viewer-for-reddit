import config from '@/lib/config'
import {SiBuymeacoffee} from 'react-icons/si'

/**
 * The footer component.
 */
export default function Footer() {
  return (
    <footer className="text-center font-mono text-xs">
      <p>
        Created and maintained by{' '}
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
      <p className="flex justify-center gap-2">
        Enjoying the app?{' '}
        <a
          aria-label="buy the author a coffee"
          className="flex items-center gap-1 font-bold underline"
          href="https://www.buymeacoffee.com/gregrickaby"
          rel="noopener noreferrer"
          target="_blank"
        >
          Buy me a coffee!
          <SiBuymeacoffee />
        </a>
      </p>
    </footer>
  )
}
