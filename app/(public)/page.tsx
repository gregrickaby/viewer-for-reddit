import { Suspense } from 'react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { safeNext } from '@/lib/auth/next-param'
import styles from './page.module.css'

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
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="landing-title">
        <Logo size={56} />
        <h1 id="landing-title" className={styles.title}>
          Reddit, fast and focused.
        </h1>
        <p className={styles.lede}>
          Your home feed, communities, multireddits, and saved posts, with voting, comments, and
          rich media. Sign in with your Reddit account to continue.
        </p>

        <Suspense fallback={<SignInForm />}>
          <SignInPanel searchParams={searchParams} />
        </Suspense>

        <p className={styles.note}>
          We never see your password. You’ll approve access on reddit.com, and you can revoke it
          anytime from your{' '}
          <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer">
            Reddit app settings
          </a>
          .
        </p>
      </section>
    </main>
  )
}
