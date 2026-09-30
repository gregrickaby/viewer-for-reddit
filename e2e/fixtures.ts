import { type Page, test as base, expect } from '@playwright/test'

export const MOCK_URL = 'http://localhost:4010'

type MockState = {
  votes: Record<string, number>
  saved: string[]
  subscribed: string[]
  writes: Array<{ path: string; form: Record<string, string> }>
}

type Fixtures = {
  /** A page signed in through the mock OAuth flow, starting on /home. */
  signedIn: Page
  mock: {
    control(options: {
      delayMs?: number
      failNext?: number
      /** Post a comment to the busy game thread, /r/pics/comments/e2elive. */
      addLiveComment?: string
      /** Replace that thread's body, like a score bot editing it. */
      liveBody?: string
      /** Add an update to the live thread /live/e2elivethread1. */
      addLiveUpdate?: string
    }): Promise<void>
    state(): Promise<MockState>
  }
}

/** Only the app itself may be reached: media hosts are blocked so runs are hermetic. */
async function blockExternal(page: Page) {
  await page.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort())
}

export async function signIn(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Sign in with Reddit' }).first().click()
  await page.waitForURL('**/home')
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, provide) => {
    await blockExternal(page)
    await provide(page)
  },
  mock: async ({ request }, provide) => {
    await request.post(`${MOCK_URL}/__mock/reset`)
    await provide({
      control: async (options) => {
        await request.post(`${MOCK_URL}/__mock/control`, { data: options })
      },
      state: async () =>
        (await request.get(`${MOCK_URL}/__mock/state`)).json() as Promise<MockState>,
    })
  },
  signedIn: async ({ page, mock }, provide) => {
    void mock
    await signIn(page)
    await provide(page)
  },
})

export { expect }
