import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderServer } from '@/tests/helpers/render-server'

const session = { username: 'spez' as string | null }
vi.mock('@/lib/auth/session', () => ({ getUsername: vi.fn(async () => session.username) }))
vi.mock('@/app/actions/auth', () => ({ signOut: vi.fn() }))
vi.mock('next/font/google', () => ({
  Reddit_Sans: () => ({ variable: 'font-sans-var' }),
  Reddit_Mono: () => ({ variable: 'font-mono-var' }),
}))

const { default: LandingPage } = await import('@/app/(public)/page')
const { default: HomePage, metadata: homeMetadata } = await import('@/app/(app)/home/page')
const { default: AppLayout } = await import('@/app/(app)/layout')
const { default: RootLayout, metadata: rootMetadata } = await import('@/app/layout')
const { UserMenu, UserMenuSkeleton } = await import('@/components/shell/user-menu')

const params = (value: Record<string, string | string[]>) => Promise.resolve(value)

beforeEach(() => {
  session.username = 'spez'
})

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

describe('signed-in shell', () => {
  it('shows the user and a sign-out form', async () => {
    const html = await renderServer(<UserMenu />)
    expect(html).toContain('u/<!-- -->spez')
    expect(html).toContain('Sign out')
  })

  it('renders nothing without a session', async () => {
    session.username = null
    expect(await renderServer(<UserMenu />)).toBe('')
  })

  it('has a skeleton for streaming', async () => {
    expect(await renderServer(<UserMenuSkeleton />)).toContain('skeleton')
  })

  it('lays out the header, brand link, and page content', async () => {
    const html = await renderServer(
      <AppLayout params={Promise.resolve({})}>
        <p>content</p>
      </AppLayout>,
    )
    expect(html).toContain('href="/home"')
    expect(html).toContain('u/<!-- -->spez')
    expect(html).toContain('<main class="main"><p>content</p></main>')
  })

  it('greets the user on /home', async () => {
    expect(homeMetadata).toEqual({ title: 'Home' })
    expect(await renderServer(<HomePage />)).toContain('Signed in as u/<!-- -->spez')
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
