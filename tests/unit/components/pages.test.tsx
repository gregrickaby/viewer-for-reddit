import { describe, expect, it, vi } from 'vitest'
import { renderServer } from '@/tests/helpers/render-server'

vi.mock('next/font/google', () => ({
  Reddit_Sans: () => ({ variable: 'font-sans-var' }),
  Reddit_Mono: () => ({ variable: 'font-mono-var' }),
}))

const { default: LandingPage } = await import('@/app/(public)/page')
const { JsonLd } = await import('@/components/site/json-ld')
const { default: RootLayout, metadata: rootMetadata } = await import('@/app/layout')

const { default: AboutPage, metadata: aboutMetadata } = await import('@/app/(public)/about/page')
const { default: DonatePage, metadata: donateMetadata } = await import('@/app/(public)/donate/page')
const { default: robots } = await import('@/app/robots')
const { default: sitemap } = await import('@/app/sitemap')
const { default: manifest } = await import('@/app/manifest')
const { metadata: shellMetadata } = await import('@/app/(app)/layout')

const params = (value: Record<string, string | string[]>) => Promise.resolve(value)

describe('landing page', () => {
  it('offers a no-JS sign-in form', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    expect(html).toContain('action="/api/auth/login" method="get"')
    expect(html).toContain('Sign in with Reddit')
    expect(html).not.toContain('role="alert"')
    expect(html).not.toContain('name="next"')
  })

  it.each([
    ['denied', 'Sign-in was cancelled'],
    ['state', 'expired or was already used'],
    ['exchange', 'didn’t finish signing you in'],
    ['session_expired', 'Your session ended'],
  ])('explains error=%s', async (error, message) => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({ error })} />,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain(message)
  })

  it('ignores unknown errors and carries a safe `next` through', async () => {
    const html = await renderServer(
      <LandingPage
        params={Promise.resolve({})}
        searchParams={params({ error: 'weird', next: '/r/pics?sort=top' })}
      />,
    )
    expect(html).not.toContain('role="alert"')
    expect(html).toContain('name="next" value="/r/pics?sort=top"')
  })

  it('lists why to sign in, and offers a second sign-in below', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    expect(html).toContain('Why use <!-- -->Viewer for Reddit')
    for (const title of ['No ads', 'You pick the sort', 'Multireddits', 'Open source']) {
      expect(html).toContain(`<h3`)
      expect(html).toContain(title)
    }
    expect(html.match(/action="\/api\/auth\/login"/g)).toHaveLength(2)
    expect(html).toContain('Ready to read Reddit without ads?')
  })

  it('explains how it works and answers common questions in plain HTML', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    expect(html).toContain('id="how-it-works"')
    expect(html.match(/<details/g)).toHaveLength(8)
    expect(html).toContain('Do comments update on their own?')
    expect(html).toContain('Does it support Reddit live threads?')
    expect(html).toContain('Why do I have to sign in?')
    expect(html).toContain('Reddit ended public access to its API in June 2026')
    // One h1, with the sections below it as h2s.
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html.match(/<h2/g)?.length).toBeGreaterThanOrEqual(4)
  })

  it('links each FAQ answer to the services and documentation it names', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    for (const href of [
      'https://nextjs.org/',
      'https://www.reddit.com/dev/api',
      'https://www.reddit.com/register/',
      'https://github.com/reddit-archive/reddit/wiki/oauth2',
      'https://www.reddit.com/prefs/apps',
      'https://github.com/gregrickaby/viewer-for-reddit#setup',
    ]) {
      expect(html).toContain(`<a href="${href}" target="_blank" rel="noopener noreferrer"`)
    }
    // Pages on this site use client links, without opening a new tab.
    expect(html).toMatch(/<a href="\/about">About page<\/a>/)
    expect(html).toMatch(/<a href="\/donate">how to donate<\/a>/)
    expect(html).toContain('then add your keys.')
    expect(html).not.toContain('add its keys')
  })

  it('has a header with About, Donate, and GitHub, and a disclaimer footer', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    expect(html).toContain('aria-label="Site"')
    expect(html).toContain('<footer')
    expect(html).toContain('not affiliated with Reddit, Inc.')
  })

  it('describes the site to search engines with structured data', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    const json = /<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)?.[1]
    const data = JSON.parse(json ?? 'null')
    expect(data['@context']).toBe('https://schema.org')
    const types = data['@graph'].map((node: { '@type': string }) => node['@type'])
    expect(types).toEqual(['WebSite', 'WebApplication'])
    expect(data['@graph'][0]).toMatchObject({
      url: 'https://localhost:3000/',
      name: 'Viewer for Reddit',
    })
    expect(data['@graph'][1]).toMatchObject({ isAccessibleForFree: true })
  })

  it('drops an unsafe or repeated `next`', async () => {
    const unsafe = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({ next: '//evil.com' })} />,
    )
    expect(unsafe).toContain('name="next" value="/home"')
    const repeated = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({ next: ['/a', '/b'] })} />,
    )
    expect(repeated).not.toContain('name="next"')
  })
})

describe('root layout', () => {
  it('ships the no-flash theme script and font variables on a static <html>', async () => {
    const html = await renderServer(
      <RootLayout params={Promise.resolve({})}>
        <p>x</p>
      </RootLayout>,
    )
    expect(html).toMatch(
      /^<!DOCTYPE html><html lang="en" data-theme="system" class="font-sans-var font-mono-var">/,
    )
    expect(html).toContain('rv_theme=(system|light|dark)')
    expect(html).toContain('<body><p>x</p></body>')
  })

  it('only sets search-engine verification when configured', () => {
    expect(rootMetadata.verification).toBeUndefined()
  })
})

describe('site pages', () => {
  it('renders About with sign-in, the source, and the Reddit disclaimer', async () => {
    const html = await renderServer(<AboutPage />)
    expect(html).toMatch(/<h1[^>]*>About <!-- -->Viewer for Reddit<\/h1>/)
    expect(html).toContain('href="/api/auth/login"')
    expect(html).toContain('href="https://github.com/gregrickaby/viewer-for-reddit"')
    expect(html).toContain('not affiliated with Reddit, Inc.')
  })

  it('tells readers what the site records, and claims no analytics-free page', async () => {
    const html = await renderServer(<AboutPage />)
    expect(html).toContain('href="https://www.datadoghq.com/"')
    expect(html).toContain('href="https://www.datadoghq.com/legal/privacy/"')
    expect(html).toContain('replays')
    expect(html).not.toContain('analytics scripts')
  })

  it('links the FAQ to the documentation it names', async () => {
    const html = await renderServer(<AboutPage />)
    expect(html).toContain('href="https://nextjs.org/"')
    expect(html).toContain('href="https://www.reddit.com/dev/api"')
    expect(html).toContain('href="/donate"')
  })

  it('frames About and Donate like the landing page, with cards and a header', async () => {
    for (const page of [<AboutPage key="a" />, <DonatePage key="d" />]) {
      const html = await renderServer(page)
      expect(html).toContain('aria-label="Site"')
      expect(html).toContain('<footer')
      expect(html.match(/<h1/g)).toHaveLength(1)
      expect(html.match(/<h2/g)?.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('tells readers about live comments, active threads, and live threads', async () => {
    const landing = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    for (const title of ['Live comments', 'Active threads', 'Reddit live threads'])
      expect(landing).toContain(title)
    const about = await renderServer(<AboutPage />)
    for (const title of ['Follow along', 'Find busy threads']) expect(about).toContain(title)
  })

  it('renders Donate with every way to give', async () => {
    const html = await renderServer(<DonatePage />)
    expect(html).toContain('href="https://buymeacoffee.com/gregrickaby"')
    expect(html).toContain('href="https://venmo.com/u/GregRickaby"')
    expect(html).toContain('href="https://www.paypal.com/paypalme/GregRickaby"')
    expect(html).toContain('Give with <!-- -->Venmo')
    expect(html).toContain('What donations pay for')
  })

  it('links About, Donate, and GitHub from the landing page', async () => {
    const html = await renderServer(
      <LandingPage params={Promise.resolve({})} searchParams={params({})} />,
    )
    expect(html).toContain('href="/about"')
    expect(html).toContain('href="/donate"')
    expect(html).toContain('href="https://github.com/gregrickaby/viewer-for-reddit"')
  })

  it('gives each public page its own canonical URL and full Open Graph data', () => {
    for (const [meta, path] of [
      [aboutMetadata, '/about'],
      [donateMetadata, '/donate'],
    ] as const) {
      expect(meta.alternates?.canonical).toBe(path)
      expect(meta.openGraph).toMatchObject({
        siteName: 'Viewer for Reddit',
        url: path,
        images: [{ url: '/social-share.png' }],
      })
    }
  })

  it('gives each public page its own Twitter card text, not the site default', () => {
    for (const meta of [aboutMetadata, donateMetadata]) {
      expect(meta.twitter).toMatchObject({
        card: 'summary_large_image',
        title: (meta.openGraph as { title: string }).title,
        description: meta.description,
        images: [{ url: '/social-share.png' }],
      })
    }
    expect(rootMetadata.twitter).toMatchObject({ title: 'Viewer for Reddit' })
  })
})

describe('JsonLd', () => {
  it('cannot be closed early by a value', async () => {
    const html = await renderServer(<JsonLd data={{ name: '</script><b>x</b>' }} />)
    expect(html).not.toContain('</script><b>')
    const json = />(.*?)<\/script>/.exec(html)?.[1] ?? ''
    expect(JSON.parse(json)).toEqual({ name: '</script><b>x</b>' })
  })
})

describe('SEO', () => {
  it('describes the site at the root without a canonical URL that would leak to every page', () => {
    expect(String(rootMetadata.metadataBase)).toBe('https://localhost:3000/')
    expect(rootMetadata.title).toMatchObject({ template: '%s · Viewer for Reddit' })
    expect(rootMetadata.alternates).toBeUndefined()
  })

  it('keeps the signed-in shell out of search indexes', () => {
    expect(shellMetadata.robots).toEqual({ index: false, follow: false })
  })

  it('lets crawlers see only the public pages, and lists them in the sitemap', () => {
    const rules = robots().rules
    expect(rules).toMatchObject({ allow: ['/', '/about', '/donate'] })
    expect(!Array.isArray(rules) && rules.disallow).toContain('/r/')
    expect(robots().sitemap).toBe('https://localhost:3000/sitemap.xml')
    expect(sitemap().map((entry) => entry.url)).toEqual([
      'https://localhost:3000/',
      'https://localhost:3000/about',
      'https://localhost:3000/donate',
    ])
    for (const entry of sitemap()) expect(String(entry.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('installs with the app icon', () => {
    const app = manifest()
    expect(app).toMatchObject({ name: 'Viewer for Reddit', id: '/', start_url: '/home' })
    // Chrome's install prompt wants a 192px and a 512px icon.
    expect(app.icons?.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    )
  })
})
