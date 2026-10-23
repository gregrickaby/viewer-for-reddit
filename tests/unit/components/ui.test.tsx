import { describe, expect, it } from 'vitest'

import { Logo } from '@/components/brand/logo'
import { Button, LinkButton } from '@/components/ui/button'
import { renderServer } from '@/tests/helpers/render-server'

describe('Button', () => {
  it('defaults to a primary, medium, non-submitting button', async () => {
    const html = await renderServer(<Button>Save</Button>)
    expect(html).toBe('<button class="button primary md" type="button">Save</button>')
  })

  it('applies variants, sizes, extra classes, and native attributes', async () => {
    const html = await renderServer(
      <Button aria-busy="true" className="wide" disabled size="sm" type="submit" variant="ghost">
        Go
      </Button>,
    )
    expect(html).toBe(
      '<button class="button ghost sm wide" type="submit" aria-busy="true" disabled="">Go</button>',
    )
  })
})

describe('LinkButton', () => {
  it('renders a styled link', async () => {
    const html = await renderServer(
      <LinkButton href="/home" size="lg" variant="secondary">
        Home
      </LinkButton>,
    )
    expect(html).toContain('href="/home"')
    expect(html).toContain('class="button secondary lg"')
    expect(html).toContain('>Home</a>')
  })
})

describe('Logo', () => {
  it('renders a decorative mark, optionally with the wordmark', async () => {
    const mark = await renderServer(<Logo />)
    expect(mark).toContain('alt=""')
    expect(mark).toContain('width="40"')
    expect(mark).not.toContain('Viewer for Reddit')

    const full = await renderServer(<Logo size={24} withWordmark />)
    expect(full).toContain('width="24"')
    expect(full).toContain('<span class="wordmark">Viewer for Reddit</span>')

    const wide = await renderServer(<Logo withWordmark="wide" />)
    expect(wide).toContain('<span class="wordmark wide">Viewer for Reddit</span>')
  })
})
