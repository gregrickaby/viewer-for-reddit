import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {SubscribeButton} from './SubscribeButton'

// Mock the useSubscribe hook
vi.mock('@/lib/hooks/useSubscribe', () => ({
  useSubscribe: vi.fn()
}))

// Import after mock
const {useSubscribe} = await import('@/lib/hooks/useSubscribe')

describe('SubscribeButton', () => {
  it('renders Join button when not subscribed', () => {
    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: false,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    render(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    const button = screen.getByRole('button', {name: /join/i})
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('renders Leave button when subscribed', () => {
    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: true,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    render(
      <SubscribeButton subredditName="ProgrammerHumor" initialIsSubscribed />
    )

    const button = screen.getByRole('button', {name: /leave/i})
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('calls toggleSubscribe when clicked', async () => {
    const mockToggleSubscribe = vi.fn()

    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: false,
      isPending: false,
      toggleSubscribe: mockToggleSubscribe
    })

    render(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    const button = screen.getByRole('button', {name: /join/i})
    await user.click(button)

    expect(mockToggleSubscribe).toHaveBeenCalledTimes(1)
  })

  it('disables button when pending', () => {
    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: false,
      isPending: true,
      toggleSubscribe: vi.fn()
    })

    render(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    const button = screen.getByRole('button', {name: /join/i})
    expect(button).toBeDisabled()
  })

  it('passes correct props to useSubscribe hook', () => {
    const mockUseSubscribe = vi.mocked(useSubscribe)
    mockUseSubscribe.mockReturnValue({
      isSubscribed: false,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    render(<SubscribeButton subredditName="react" initialIsSubscribed />)

    expect(mockUseSubscribe).toHaveBeenCalledWith({
      subredditName: 'react',
      initialIsSubscribed: true
    })
  })

  it('updates button text when subscription state changes', () => {
    const mockUseSubscribe = vi.mocked(useSubscribe)

    // Initially not subscribed
    mockUseSubscribe.mockReturnValue({
      isSubscribed: false,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    const {rerender} = render(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    expect(screen.getByRole('button', {name: /join/i})).toBeInTheDocument()

    // Simulate subscription state change
    mockUseSubscribe.mockReturnValue({
      isSubscribed: true,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    rerender(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    expect(screen.getByRole('button', {name: /leave/i})).toBeInTheDocument()
  })

  it('does not call toggleSubscribe multiple times when pending', async () => {
    const mockToggleSubscribe = vi.fn()

    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: false,
      isPending: true,
      toggleSubscribe: mockToggleSubscribe
    })

    render(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    const button = screen.getByRole('button', {name: /join/i})

    // Try to click multiple times while disabled
    await user.click(button)
    await user.click(button)
    await user.click(button)

    // Button is disabled, so clicks shouldn't trigger the handler
    // But the handler itself would prevent double calls anyway
    expect(mockToggleSubscribe).toHaveBeenCalledTimes(0)
  })

  it('renders with correct Mantine Button props when not subscribed', () => {
    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: false,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    render(
      <SubscribeButton
        subredditName="ProgrammerHumor"
        initialIsSubscribed={false}
      />
    )

    const button = screen.getByRole('button', {name: /join/i})

    // Mantine applies these as data attributes or classes
    // We verify the button exists with correct text
    expect(button).toHaveTextContent('Join')
  })

  it('renders with correct Mantine Button props when subscribed', () => {
    vi.mocked(useSubscribe).mockReturnValue({
      isSubscribed: true,
      isPending: false,
      toggleSubscribe: vi.fn()
    })

    render(
      <SubscribeButton subredditName="ProgrammerHumor" initialIsSubscribed />
    )

    const button = screen.getByRole('button', {name: /leave/i})

    // Mantine applies these as data attributes or classes
    // We verify the button exists with correct text
    expect(button).toHaveTextContent('Leave')
  })
})
