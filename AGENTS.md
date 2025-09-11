# AGENTS.md file

## Dev environment

This project uses Node v22, NPM v11, React v19, Next.js v15, TypeScript, Vitest, MSW v2, React Testing Library, Mantine v8, and Reddit's public REST API.

Instructions

- Mantine provides LLMs.txt. Reference the documentation URL: <https://mantine.dev/llms.txt>
- Components must be as presentation as possible. Create hooks instead of adding complex logic inside components.

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

Example test file structure:

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
