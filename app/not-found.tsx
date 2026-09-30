import type { Metadata } from 'next'
import { ContentPage } from '@/components/site/content-page'
import { LinkButton } from '@/components/ui/button'
import styles from '@/components/site/content-page.module.css'

export const metadata: Metadata = { title: 'Not found' }

/**
 * An address this app doesn't have (the signed-in shell has its own for Reddit 404s).
 * It can't tell who is looking, so it links to `/`: the proxy sends signed-in
 * readers on to their feed and signed-out readers to the landing page.
 */
export default function NotFound() {
  return (
    <ContentPage>
      <h1>This page doesn’t exist</h1>
      <p className={styles.lede}>Check the address, or head back to the start.</p>
      <div>
        <LinkButton href="/">Back to Home</LinkButton>
      </div>
    </ContentPage>
  )
}
