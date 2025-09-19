# AGENTS.md file

## ## Testing

### Critical Testing Workflow

1. **Write test plan** - list behaviors/branches to test
2. **Create test file** - use MSW v2 for network calls
3. **Run tests**: `npm test` (watch mode) or `npm run coverage` (report)
4. **Fix errors** - ensure 100% test coverage and no type errors

### Instructions

- Use Mantine v8 components and hooks as per documentation: <https://mantine.dev/llms.txt>
- Aim for 100% line/branch/function coverage of actual control flow (no speculative edge cases).
- Write small, non-overlapping tests.
- Use MSW 2.0 format for all network I/O; don't mock fetch/axios/circuit breakers unless the hook requires it.
- Tests must be deterministic and independent; reset MSW handlers when needed.
- Name tests with `it('should …')`, concise and behavior-focused.
- Prefer direct assertions; use `waitFor` for async state; use fake timers only when needed (restore each test).
- Fix any test or type errors until the whole suite is green.

### Deliver

1. **Test plan** with short list of behaviors/branches.
2. **Single test file**:
   - Use either `render()` or `renderHook()` functions from `@/test-utils`.
   - Assume global MSW server listen/reset/close is already wired. If not, create them inside each individual test.
   - Use `beforeEach/afterEach` for setup/teardown.
   - Use `describe` blocks to group related tests.s project uses Node v22, NPM v11, React v19, Next.js v15, TypeScript, Vitest, MSW v2, React Testing Library, Mantine v8, and Reddit's public REST API.

## Component Development Workflow

1. **Create component folder** in `components/ComponentName/`
2. **Create three files**: `ComponentName.tsx`, `ComponentName.module.css`, `ComponentName.test.tsx`
3. **Extract logic to hooks** - keep components presentational
4. **Write tests first** - follow testing patterns below
5. **Run tests**: `npm test` to validate implementation

## Notes

- Mantine provides LLMs.txt. Reference the documentation URL: <https://mantine.dev/llms.txt>
- Components must be as presentational as possible. Create hooks instead of adding complex logic inside components.
- Use `@/` imports for all internal modules
- Always use `Readonly<Props>` for component props

## Testing

Instructions

- Aim for 100% line/branch/function coverage of actual control flow (no speculative edge cases).
- Write small, non-overlapping tests.
- Use MSW 2.0 format for all network I/O; don’t mock fetch/axios/circuit breakers unless the hook requires it.
- Tests must be deterministic and independent; reset MSW handlers when needed.
- Name tests with it('should …'), concise and behavior-focused.
- Prefer direct assertions; use waitFor for async state; use fake timers only when needed (restore each test).
- Fix any test or type errors until the whole suite is green.

Deliver

1. Test plan with short list of behaviors/branches.
2. Single test file:
   - Use either render() or renderHook() functions from @/test-utils.
   - Assume global MSW server listen/reset/close is already wired. If not, create them inside each individual test.
   - Use beforeEach/afterEach for setup/teardown.
   - Use describe blocks to group related tests.

Example component test file structure:

```typescript
import BackToTop from '@/components/BackToTop/BackToTop'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {scrollRef, scrollToMock} = vi.hoisted(() => ({
  scrollRef: {y: 0},
  scrollToMock: vi.fn()
}))

vi.mock('@mantine/hooks', () => ({
  useWindowScroll: () => [scrollRef, scrollToMock]
}))

describe('BackToTop', () => {
  beforeEach(() => {
    scrollRef.y = 0
    scrollToMock.mockClear()
  })

  it('does not render when scrolled less than or equal to 200', () => {
    scrollRef.y = 100
    render(<BackToTop />)
    expect(
      screen.queryByRole('button', {name: 'Go back to the top of the page'})
    ).not.toBeInTheDocument()
  })

  it('renders button and scrolls to top when clicked', async () => {
    scrollRef.y = 250
    render(<BackToTop />)
    const button = screen.getByRole('button', {
      name: 'Go back to the top of the page'
    })
    await userEvent.click(button)
    expect(scrollToMock).toHaveBeenCalledWith({y: 0})
  })
})
```

Example backend test file structure:

```typescript
import {logError} from '@/lib/utils/logError'
import {tokenMock} from '@/test-utils/mocks/token'
import {server} from '@/test-utils/msw/server'
import {http, HttpResponse} from 'msw'
import {fetchToken, getRedditToken} from './redditToken'
import {
  getCachedToken,
  getRequestCount,
  resetTokenState,
  setTokenState,
  shouldFetchNewToken
} from '@/lib/utils/token'

vi.mock('@/lib/utils/logError', () => ({
  logError: vi.fn()
}))

describe('fetchToken', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetTokenState()
  })

  it('returns a valid token on success', async () => {
    const token = await fetchToken()

    expect(token).toStrictEqual(tokenMock)
  })

  it('throws an error when ENV vars are missing', async () => {
    vi.unstubAllEnvs()

    const token = await fetchToken()

    expect(token).toBeNull()
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Missing Reddit ENV variables'
      })
    )

    vi.stubEnv('REDDIT_CLIENT_ID', 'test_id')
    vi.stubEnv('REDDIT_CLIENT_SECRET', 'test_secret')
  })

  it('throws an error when the token request fails', async () => {
    server.use(
      http.post('https://www.reddit.com/api/v1/access_token', async () => {
        return HttpResponse.json(
          {
            message: 'Unauthorized'
          },
          {status: 401}
        )
      })
    )

    const token = await fetchToken()

    expect(token).toBeNull()
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to fetch Reddit OAuth token: Unauthorized'
      })
    )
  })

  it('throws an error when the token response is invalid', async () => {
    server.use(
      http.post('https://www.reddit.com/api/v1/access_token', async () => {
        return HttpResponse.json({
          access_token: '',
          expires_in: 0,
          scope: '',
          token_type: ''
        })
      })
    )

    const token = await fetchToken()

    expect(token).toBeNull()
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid token response'
      })
    )
  })
})

describe('getRedditToken', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetTokenState()
  })

  it('fetches and caches a new token when no token exists', async () => {
    const token = await getRedditToken()
    expect(token).toStrictEqual(tokenMock)
    expect(getRequestCount()).toBe(0)
  })

  it('logs and returns null if token response is missing access_token', async () => {
    server.use(
      http.post('https://www.reddit.com/api/v1/access_token', () =>
        HttpResponse.json({
          access_token: '',
          token_type: 'bearer',
          expires_in: 86400,
          scope: '*',
          error: 'invalid_token'
        })
      )
    )

    const result = await getRedditToken()

    expect(result).toBeNull()
    expect(logError).toHaveBeenCalledWith('Failed to fetch Reddit OAuth token')
  })
})
```
