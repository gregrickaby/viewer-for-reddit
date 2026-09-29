import { describe, expect, it } from 'vitest'
import { Logo } from '@/components/brand/logo'
import { Button, LinkButton } from '@/components/ui/button'
import { renderServer } from '@/tests/helpers/render-server'

describe('Button', () => {
  it('defaults to a primary, medium, non-submitting button', async () => {
    const html = await renderServer(<Button>Save</Button>)
    expect(html).toBe('<button type="button" class="button primary md">Save</button>')
  })

  it('applies variants, sizes, extra classes, and native attributes', async () => {
    const html = await renderServer(
      <Button type="submit" variant="ghost" size="sm" className="wide" disabled aria-busy="true">
        Go
      </Button>,
    )
    expect(html).toBe(
      '<button type="submit" class="button ghost sm wide" disabled="" aria-busy="true">Go</button>',
    )
  })
})

describe('LinkButton', () => {
  it('renders a styled link', async () => {
    const html = await renderServer(
      <LinkButton href="/home" variant="secondary" size="lg">
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
    expect(mark).toContain('aria-hidden="true"')
    expect(mark).toContain('width="40"')
    expect(mark).not.toContain('Reddit Viewer')

    const full = await renderServer(<Logo size={24} withWordmark />)
    expect(full).toContain('width="24"')
    expect(full).toContain('<span class="wordmark">Reddit Viewer</span>')
  })
})
