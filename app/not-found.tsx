import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { LinkButton } from '@/components/ui/button'
import { SITE } from '@/lib/site'
import site from '@/components/site/site.module.css'

export const metadata: Metadata = { title: 'Not found' }

/**
 * An address this app doesn't have (the signed-in shell has its own for Reddit 404s).
 * It can't tell who is looking, so it links to `/`: the proxy sends signed-in
 * readers on to their feed and signed-out readers to the landing page.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <section className={`${site.inner} ${site.pageHero}`} aria-labelledby="not-found-title">
        <p className={site.bigNumber} aria-hidden="true">
          404
        </p>
        <h1 id="not-found-title" className={site.title}>
          This page doesn’t exist
        </h1>
        <p className={site.lede}>Check the address, or head back to the start.</p>
        <div className={site.actions}>
          <LinkButton href="/" size="lg">
            Back to Home
          </LinkButton>
          <LinkButton href="/about" variant="secondary" size="lg">
            About {SITE.name}
          </LinkButton>
        </div>
      </section>
    </SiteShell>
  )
}
