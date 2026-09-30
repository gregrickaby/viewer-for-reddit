import type { Metadata } from 'next'
import { ContentPage } from '@/components/site/content-page'
import { OPEN_GRAPH, SITE } from '@/lib/site'
import styles from '@/components/site/content-page.module.css'

const description = `Support ${SITE.name}. Donations pay for hosting and keep it free and ad-free.`

export const metadata: Metadata = {
  title: 'Donate',
  description,
  alternates: { canonical: '/donate' },
  openGraph: { ...OPEN_GRAPH, title: `Support ${SITE.name}`, description, url: '/donate' },
}

export default function DonatePage() {
  return (
    <ContentPage>
      <h1>Support {SITE.name}</h1>
      <p className={styles.lede}>
        {SITE.name} is free, open source, and ad-free. I build and maintain it in my spare time.
      </p>

      <h2>What donations pay for</h2>
      <ul>
        <li>Hosting, the domain, and development tools.</li>
        <li>Time for new features, bug fixes, and keeping up with Reddit’s API.</li>
      </ul>

      <h2>Ways to give</h2>
      <ul>
        {SITE.donate.map((option) => (
          <li key={option.label}>
            <a href={option.href}>
              {option.label}: {option.handle}
            </a>
          </li>
        ))}
      </ul>

      <h2>Not ready to donate?</h2>
      <p>That’s fine. You can still help:</p>
      <ul>
        <li>
          <a href={SITE.links.github}>Star the project</a> on GitHub.
        </li>
        <li>
          <a href={SITE.links.issues}>Report a bug or request a feature</a>.
        </li>
        <li>Tell a friend who reads Reddit.</li>
      </ul>

      <p>
        Thank you. Every contribution, however small, helps keep this project free for everyone.
      </p>
    </ContentPage>
  )
}
