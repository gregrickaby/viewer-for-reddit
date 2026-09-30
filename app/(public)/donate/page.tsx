import type { Metadata } from 'next'
import { FeatureIcon } from '@/components/site/landing-icons'
import { SiteShell } from '@/components/site/site-shell'
import { OPEN_GRAPH, SITE, TWITTER } from '@/lib/site'
import site from '@/components/site/site.module.css'

const description = `Support ${SITE.name}. Donations pay for hosting and keep it free and ad-free.`

export const metadata: Metadata = {
  title: 'Donate',
  description,
  alternates: { canonical: '/donate' },
  openGraph: { ...OPEN_GRAPH, title: `Support ${SITE.name}`, description, url: '/donate' },
  twitter: { ...TWITTER, title: `Support ${SITE.name}`, description },
}

export default function DonatePage() {
  return (
    <SiteShell>
      <section className={`${site.inner} ${site.pageHero}`} aria-labelledby="donate-title">
        <p className={site.eyebrow}>Support the project</p>
        <h1 id="donate-title" className={site.title}>
          Support {SITE.name}
        </h1>
        <p className={site.lede}>
          {SITE.name} is free, open source, and ad-free. I build and maintain it in my spare time.
        </p>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="pays-title">
        <h2 id="pays-title" className={site.sectionTitle}>
          What donations pay for
        </h2>
        <ul className={site.cardsTwo} role="list">
          <li className={site.card}>
            <span className={site.icon}>
              <FeatureIcon name="server" />
            </span>
            <h3 className={site.cardTitle}>Hosting and tools</h3>
            <p className={site.cardText}>Hosting, the domain, and development tools.</p>
          </li>
          <li className={site.card}>
            <span className={site.icon}>
              <FeatureIcon name="code" />
            </span>
            <h3 className={site.cardTitle}>Time to build</h3>
            <p className={site.cardText}>
              Time for new features, bug fixes, and keeping up with Reddit’s API.
            </p>
          </li>
        </ul>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="give-title">
        <h2 id="give-title" className={site.sectionTitle}>
          Ways to give
        </h2>
        <ul className={site.cardsThree} role="list">
          {SITE.donate.map((option) => (
            <li key={option.label} className={site.card}>
              <span className={site.icon}>
                <FeatureIcon name="heart" />
              </span>
              <h3 className={site.cardTitle}>{option.label}</h3>
              <p className={site.cardText}>{option.handle}</p>
              <a
                href={option.href}
                className={site.cardAction}
                target="_blank"
                rel="noopener noreferrer"
              >
                Give with {option.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="help-title">
        <h2 id="help-title" className={site.sectionTitle}>
          Not ready to donate?
        </h2>
        <p className={site.lede}>That’s fine. You can still help.</p>
        <ul className={site.cardsThree} role="list">
          <li className={site.card}>
            <span className={site.icon}>
              <FeatureIcon name="star" />
            </span>
            <h3 className={site.cardTitle}>Star the project</h3>
            <p className={site.cardText}>
              <a href={SITE.links.github}>Star it on GitHub</a> so more people find it.
            </p>
          </li>
          <li className={site.card}>
            <span className={site.icon}>
              <FeatureIcon name="bug" />
            </span>
            <h3 className={site.cardTitle}>Report a bug</h3>
            <p className={site.cardText}>
              <a href={SITE.links.issues}>Report a bug or request a feature</a> in GitHub Issues.
            </p>
          </li>
          <li className={site.card}>
            <span className={site.icon}>
              <FeatureIcon name="share" />
            </span>
            <h3 className={site.cardTitle}>Spread the word</h3>
            <p className={site.cardText}>Tell a friend who reads Reddit.</p>
          </li>
        </ul>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="thanks-title">
        <div className={site.closing}>
          <h2 id="thanks-title" className={site.sectionTitle}>
            Thank you
          </h2>
          <p className={site.lede}>
            Every contribution, however small, helps keep this project free for everyone.
          </p>
        </div>
      </section>
    </SiteShell>
  )
}
