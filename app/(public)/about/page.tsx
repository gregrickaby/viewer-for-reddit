import type { Metadata } from 'next'
import Link from 'next/link'
import { ContentPage } from '@/components/site/content-page'
import { OPEN_GRAPH, SITE } from '@/lib/site'
import styles from '@/components/site/content-page.module.css'

const description = `How ${SITE.name} works, what it does with your data, and who builds it.`

export const metadata: Metadata = {
  title: 'About',
  description,
  alternates: { canonical: '/about' },
  openGraph: { ...OPEN_GRAPH, title: `About ${SITE.name}`, description, url: '/about' },
}

export default function AboutPage() {
  return (
    <ContentPage>
      <h1>About {SITE.name}</h1>
      <p className={styles.lede}>
        {SITE.name} is a clean way to browse Reddit without ads or algorithms.{' '}
        <a href="/api/auth/login">Sign in to start browsing</a>.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>Sign in with your Reddit account.</li>
        <li>
          Read your home feed, communities, multireddits, saved posts, and profiles, and search for
          communities.
        </li>
        <li>
          Vote, save, comment and reply, join communities, follow people, and build multireddits.
        </li>
        <li>Works on desktop, tablet, and phone, in light or dark mode.</li>
      </ul>

      <h2>Frequently asked questions</h2>
      <h3>How is this different from reddit.com?</h3>
      <p>
        There are no ads, promoted posts, or analytics scripts. Your browser never calls Reddit’s
        API: this site’s server makes every request, and pages arrive already rendered.
      </p>
      <h3>Why do I have to sign in?</h3>
      <p>
        Reddit turned off unauthenticated access to its content API, so third-party apps like this
        one need you to sign in to work at all. If you don’t have an account yet,{' '}
        <a href="https://www.reddit.com/register/">register on Reddit</a>.
      </p>
      <h3>Is my data safe?</h3>
      <p>
        Yes. Sign-in uses Reddit’s{' '}
        <a href="https://github.com/reddit-archive/reddit/wiki/oauth2">official OAuth2 flow</a>, so
        your password never reaches this site. Your access tokens live in encrypted cookies in your
        own browser, not in a database, and signing out revokes them at Reddit. You can also revoke
        access anytime from your <a href="https://www.reddit.com/prefs/apps">Reddit app settings</a>
        . Nothing is sold.
      </p>

      <h2>About this project</h2>
      <p>
        I’m <a href={SITE.author.url}>{SITE.author.name}</a>, a software engineer. I built{' '}
        {SITE.name} in 2020 to learn TypeScript and to get a simpler way to browse Reddit. Thousands
        of people use it, and I use it every day. The code is{' '}
        <a href={SITE.links.github}>open source</a> and built with{' '}
        <a href="https://nextjs.org/">Next.js</a> and React Server Components.
      </p>

      <h2>Contributing</h2>
      <p>
        Report bugs and suggest features in <a href={SITE.links.issues}>GitHub Issues</a>. To help
        keep the project running, see <Link href="/donate">how to support it</Link>.
      </p>

      <p>
        <small>
          See Reddit’s <a href="https://redditinc.com/brand">brand guidelines</a>,{' '}
          <a href="https://redditinc.com/policies/data-api-terms">API terms</a>, and{' '}
          <a href="https://www.reddit.com/dev/api/">API documentation</a>.
        </small>
      </p>
    </ContentPage>
  )
}
