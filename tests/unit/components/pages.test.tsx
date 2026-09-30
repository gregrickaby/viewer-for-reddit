import { describe, expect, it, vi } from 'vitest'
import { renderServer } from '@/tests/helpers/render-server'

vi.mock('next/font/google', () => ({
  Reddit_Sans: () => ({ variable: 'font-sans-var' }),
  Reddit_Mono: () => ({ variable: 'font-mono-var' }),
}))

const { default: LandingPage } = await import('@/app/(public)/page')
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
    expect(html).toContain('<h1>About <!-- -->Viewer for Reddit</h1>')
    expect(html).toContain('href="/api/auth/login"')
    expect(html).toContain('href="https://github.com/gregrickaby/viewer-for-reddit"')
    expect(html).toContain('not affiliated with Reddit, Inc.')
  })

  it('renders Donate with every way to give', async () => {
    const html = await renderServer(<DonatePage />)
    expect(html).toContain('href="https://buymeacoffee.com/gregrickaby"')
    expect(html).toContain('href="https://venmo.com/u/GregRickaby"')
    expect(html).toContain('href="https://www.paypal.com/paypalme/GregRickaby"')
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
  })

  it('installs with the app icon', () => {
    expect(manifest()).toMatchObject({ name: 'Viewer for Reddit', start_url: '/home' })
  })
})
