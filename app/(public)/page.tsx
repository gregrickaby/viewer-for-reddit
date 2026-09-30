import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { JsonLd } from '@/components/site/json-ld'
import { AppPreview } from '@/components/site/app-preview'
import { FaqAnswer } from '@/components/site/faq-answer'
import { FeatureIcon } from '@/components/site/landing-icons'
import { SiteShell } from '@/components/site/site-shell'
import { Button } from '@/components/ui/button'
import { safeNext } from '@/lib/auth/next-param'
import { env } from '@/lib/env'
import { FAQ, FEATURES, OPEN_GRAPH, SITE, STEPS, structuredData } from '@/lib/site'
import site from '@/components/site/site.module.css'
import styles from './page.module.css'

/** The title and description are the site defaults (app/layout.tsx). */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...OPEN_GRAPH, url: '/' },
}

const ERROR_MESSAGES = {
  denied: 'Sign-in was cancelled on Reddit. You can try again whenever you’re ready.',
  state: 'That sign-in attempt expired or was already used. Please try again.',
  exchange: 'Reddit didn’t finish signing you in. Please try again in a moment.',
  session_expired: 'Your session ended. Sign in again to pick up where you left off.',
} as const

type ErrorCode = keyof typeof ERROR_MESSAGES

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in ERROR_MESSAGES
}

/** Plain GET form so sign-in works before hydration or without JavaScript. */
function SignInForm({ next }: { next?: string }) {
  return (
    <form action="/api/auth/login" method="get" className={styles.form}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" size="lg" className={styles.cta}>
        Sign in with Reddit
      </Button>
    </form>
  )
}

async function SignInPanel({ searchParams }: Pick<PageProps<'/'>, 'searchParams'>) {
  const params = await searchParams
  const error = isErrorCode(params.error) ? params.error : null
  const next = typeof params.next === 'string' ? safeNext(params.next) : undefined

  return (
    <>
      {error ? (
        <p className={styles.alert} role="alert">
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}
      <SignInForm next={next} />
    </>
  )
}

export default function LandingPage({ searchParams }: PageProps<'/'>) {
  return (
    <SiteShell>
      <JsonLd data={structuredData(env.BASE_URL)} />
      <section className={`${site.inner} ${styles.hero}`} aria-labelledby="landing-title">
        <div className={styles.heroText}>
          <p className={site.eyebrow}>Free and open source</p>
          <h1 id="landing-title" className={site.title}>
            Reddit without the ads.
          </h1>
          <p className={site.lede}>
            {SITE.name} is a fast, focused way to read your home feed, communities, and saved posts.
            Vote, comment, and follow people, with no ads or promoted posts.
          </p>

          <Suspense fallback={<SignInForm />}>
            <SignInPanel searchParams={searchParams} />
          </Suspense>

          <ul className={styles.trust} role="list">
            <li>No ads</li>
            <li>Free</li>
            <li>Open source</li>
          </ul>
          <p className={site.note}>
            We never see your password. You’ll approve access on reddit.com, and you can revoke it
            anytime from your{' '}
            <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer">
              Reddit app settings
            </a>
            .
          </p>
        </div>
        <div className={styles.preview}>
          <AppPreview />
        </div>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="why-title">
        <h2 id="why-title" className={site.sectionTitle}>
          Why use {SITE.name}
        </h2>
        <ul className={site.cards} role="list">
          {FEATURES.map((feature) => (
            <li key={feature.title} className={site.card}>
              <span className={site.icon}>
                <FeatureIcon name={feature.icon} />
              </span>
              <h3 className={site.cardTitle}>{feature.title}</h3>
              <p className={site.cardText}>{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="how-it-works"
        className={`${site.inner} ${site.section}`}
        aria-labelledby="how-title"
      >
        <h2 id="how-title" className={site.sectionTitle}>
          How it works
        </h2>
        <ol className={styles.steps} role="list">
          {STEPS.map((step) => (
            <li key={step.title} className={styles.step}>
              <h3 className={site.cardTitle}>{step.title}</h3>
              <p className={site.cardText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="faq-title">
        <h2 id="faq-title" className={site.sectionTitle}>
          Frequently asked questions
        </h2>
        <div className={site.faq}>
          {FAQ.map((item) => (
            <details key={item.question} className={site.faqItem}>
              <summary className={site.faqQuestion}>{item.question}</summary>
              <p className={site.faqAnswer}>
                <FaqAnswer parts={item.answer} />
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${site.inner} ${site.section}`} aria-labelledby="closing-title">
        <div className={site.closing}>
          <h2 id="closing-title" className={site.sectionTitle}>
            Ready to read Reddit without ads?
          </h2>
          <p className={site.lede}>Sign in with your Reddit account to start.</p>
          <SignInForm />
          <p className={site.note}>
            Read <Link href="/about">how it works</Link>, or{' '}
            <a href={SITE.links.github} target="_blank" rel="noopener noreferrer">
              view the code on GitHub
            </a>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  )
}
