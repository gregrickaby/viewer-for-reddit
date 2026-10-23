import type { Metadata } from 'next'

import { SiteShell } from '@/components/site/site-shell'
import site from '@/components/site/site.module.css'
import { LinkButton } from '@/components/ui/button'
import { SITE } from '@/lib/site'

export const metadata: Metadata = { title: 'Not found' }

/**
 * An address this app doesn't have (the signed-in shell has its own for Reddit 404s).
 * It can't tell who is looking, so it links to `/`: the proxy sends signed-in
 * readers on to their feed and signed-out readers to the landing page.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <section aria-labelledby="not-found-title" className={`${site.inner} ${site.pageHero}`}>
        <p aria-hidden="true" className={site.bigNumber}>
          404
        </p>
        <h1 className={site.title} id="not-found-title">
          This page doesn&apos;t exist
        </h1>
        <p className={site.lede}>Check the address, or head back to the start.</p>
        <div className={site.actions}>
          <LinkButton href="/" size="lg">
            Back to Home
          </LinkButton>
          <LinkButton href="/about" size="lg" variant="secondary">
            About {SITE.name}
          </LinkButton>
        </div>
      </section>
    </SiteShell>
  )
}
