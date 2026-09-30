import type { Metadata } from 'next'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/button'
import { FeatureIcon } from '@/components/site/landing-icons'
import { SiteShell } from '@/components/site/site-shell'
import { OPEN_GRAPH, SITE, TWITTER } from '@/lib/site'
import site from '@/components/site/site.module.css'

const description = `How ${SITE.name} works, what it does with your data, and who builds it.`

export const metadata: Metadata = {
  title: 'About',
  description,
  alternates: { canonical: '/about' },
  openGraph: { ...OPEN_GRAPH, title: `About ${SITE.name}`, description, url: '/about' },
  twitter: { ...TWITTER, title: `About ${SITE.name}`, description },
}

const CAPABILITIES = [
  {
    icon: 'read',
    title: 'Read',
    text: 'Your home feed, Popular, communities, multireddits, saved posts, and profiles, and a search for communities.',
  },
  {
    icon: 'chat',
    title: 'Join in',
    text: 'Vote, save, comment and reply, join communities, follow people, and build multireddits.',
  },
  {
    icon: 'play',
    title: 'Watch',
    text: 'Images, galleries, GIFs, and Reddit video with sound.',
  },
  {
    icon: 'moon',
    title: 'Pick a theme',
    text: 'Switch between light and dark mode on any screen size.',
  },
] as const

export default function AboutPage() {
  return (
    <SiteShell>
      <section className={`${site.inner} ${site.pageHero}`} aria-labelledby="about-title">
        <p className={site.eyebrow}>About</p>
        <h1 id="about-title" className={site.title}>
          About {SITE.name}
        </h1>
        <p className={site.lede}>
          I built {SITE.name} in 2020 to learn TypeScript and to read Reddit without the clutter. I
          use it every day, and thousands of other people do too.{' '}
          <a href="/api/auth/login">Sign in to start browsing</a>.
        </p>
        <p className={site.note}>
          Version 10 is a full rewrite. The server makes every request to Reddit and sends pages
          already rendered, so the site loads fast on phones, tablets, and desktops.
        </p>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="can-title">
        <h2 id="can-title" className={site.sectionTitle}>
          What you can do
        </h2>
        <ul className={site.cardsTwo} role="list">
          {CAPABILITIES.map((item) => (
            <li key={item.title} className={site.card}>
              <span className={site.icon}>
                <FeatureIcon name={item.icon} />
              </span>
              <h3 className={site.cardTitle}>{item.title}</h3>
              <p className={site.cardText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="faq-title">
        <h2 id="faq-title" className={site.sectionTitle}>
          Frequently asked questions
        </h2>
        <div className={site.cardsTwo}>
          <article className={site.card}>
            <h3 className={site.cardTitle}>How is this different from reddit.com?</h3>
            <p className={site.cardText}>
              There are no ads or promoted posts, and you pick the sort: Best, Hot, New, Top, or
              Rising. The site is built with <a href="https://nextjs.org/">Next.js</a>, so its
              server makes every request to Reddit and your browser never calls Reddit’s API.
            </p>
          </article>
          <article className={site.card}>
            <h3 className={site.cardTitle}>Why do I have to sign in?</h3>
            <p className={site.cardText}>
              Reddit ended public access to its API in June 2026, so apps like this one can’t read
              anything without your account. Reddit explains how apps get access in its{' '}
              <a href="https://www.reddit.com/dev/api">API documentation</a>. If you don’t have an
              account, <a href="https://www.reddit.com/register/">register on Reddit</a>.
            </p>
          </article>
          <article className={site.card}>
            <h3 className={site.cardTitle}>What does the site record?</h3>
            <p className={site.cardText}>
              Sign-in uses Reddit’s{' '}
              <a href="https://github.com/reddit-archive/reddit/wiki/oauth2">
                official OAuth2 flow
              </a>
              , so your password never reaches this site. Your access tokens live in encrypted
              cookies in your own browser, not in a database, and signing out revokes them at
              Reddit. You can also revoke access anytime from your{' '}
              <a href="https://www.reddit.com/prefs/apps">Reddit app settings</a>.
            </p>
            <p className={site.cardText}>
              I use <a href="https://www.datadoghq.com/">Datadog</a> to find bugs and slow pages. It
              records page views, clicks, errors, and load times, with your browser type and a
              location based on your IP address. I don’t record replays of your visits, and I don’t
              sell your data. Read{' '}
              <a href="https://www.datadoghq.com/legal/privacy/">Datadog’s privacy policy</a> for
              how it handles that data.
            </p>
          </article>
          <article className={site.card}>
            <h3 className={site.cardTitle}>Is it free?</h3>
            <p className={site.cardText}>
              Yes, and it has no ads. Donations pay for hosting, the domain, and development tools.
              See <Link href="/donate">how to donate</Link>.
            </p>
          </article>
        </div>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="contribute-title">
        <div className={site.closing}>
          <h2 id="contribute-title" className={site.sectionTitle}>
            Contributing
          </h2>
          <p className={site.lede}>
            The code is <a href={SITE.links.github}>open source</a> and built with{' '}
            <a href="https://nextjs.org/">Next.js</a> and React Server Components. Report bugs and
            suggest features in <a href={SITE.links.issues}>GitHub Issues</a>.
          </p>
          <div className={site.actions}>
            <LinkButton href="/donate" size="lg">
              Support the project
            </LinkButton>
            <a
              href={SITE.links.issues}
              className={site.cardAction}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report a bug
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
