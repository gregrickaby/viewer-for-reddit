import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRIVATE_PREFIXES, PUBLIC_PAGES, isPrivatePath } from '@/lib/site'

const folders = (dir: string) =>
  readdirSync(path.join(process.cwd(), dir), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

describe('private route prefixes', () => {
  it('cover every folder of signed-in routes, so none is shown to a signed-out reader as a 404', () => {
    for (const name of folders('app/(app)')) {
      expect(isPrivatePath(`/${name}`), `/${name}`).toBe(true)
      expect(isPrivatePath(`/${name}/example`), `/${name}/example`).toBe(true)
    }
  })

  it('cover every API route, and leave the sign-in routes to the proxy’s public list', () => {
    for (const name of folders('app/api')) expect(isPrivatePath(`/api/${name}`)).toBe(true)
  })

  it('never include a public page', () => {
    for (const page of PUBLIC_PAGES) expect(isPrivatePath(page)).toBe(false)
  })

  it('match whole path segments only', () => {
    expect(isPrivatePath('/home')).toBe(true)
    expect(isPrivatePath('/home/feed')).toBe(true)
    expect(isPrivatePath('/homes')).toBe(false)
    expect(isPrivatePath('/')).toBe(false)
    expect(PRIVATE_PREFIXES.length).toBeGreaterThan(0)
  })
})
