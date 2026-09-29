import { vi } from 'vitest'

/** A minimal stand-in for the `cookies()` store from `next/headers`. */
export function fakeCookieJar(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    store,
    get: vi.fn((name: string) =>
      store.has(name) ? { name, value: store.get(name) as string } : undefined,
    ),
    set: vi.fn((name: string, value: string) => {
      store.set(name, value)
    }),
    delete: vi.fn((name: string) => {
      store.delete(name)
    }),
  }
}

export type FakeCookieJar = ReturnType<typeof fakeCookieJar>
