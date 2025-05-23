import config from '@/lib/config'
import {Container} from '@mantine/core'
import {SiBuymeacoffee} from 'react-icons/si'

/**
 * Generate metadata.
 */
export async function generateMetadata() {
  return {
    title: `About - ${config.siteName}`,
    description: `${config.siteName} has been a fast, private way to browse Reddit media since 2020. No ads. No tracking.`,
    alternates: {
      canonical: `${config.siteUrl}about`
    },
    openGraph: {
      title: `About - ${config.siteName}`,
      description: `Learn more about the motivation and creator behind ${config.siteName}, a privacy-first Reddit viewer.`,
      url: `${config.siteUrl}about`,
      images: [
        {
          url: `${config.siteUrl}social-share.webp`,
          width: 1200,
          height: 630,
          alt: config.siteName
        }
      ]
    }
  }
}

/**
 * The about page.
 */
export default async function About() {
  return (
    <Container size="sm">
      <h2>About</h2>
      <p>
        <strong>Viewer for Reddit</strong> has been a fast, private way to
        browse media on Reddit since 2020.
      </p>
      <p>
        There's no tracking, no ads, and no personalized feeds or algorithms —
        just a clean, fast browsing experience.
      </p>
      <p>
        Built and maintained by{' '}
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
      <p>
        Enjoying the app?{' '}
        <a
          aria-label="buy the author a coffee"
          href="https://www.buymeacoffee.com/gregrickaby"
          rel="noopener noreferrer"
          target="_blank"
        >
          Buy me a coffee!
          <SiBuymeacoffee />
        </a>
      </p>
    </Container>
  )
}
