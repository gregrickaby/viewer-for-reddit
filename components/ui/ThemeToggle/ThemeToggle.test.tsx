import {render, screen, userEvent} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {ThemeToggle} from './ThemeToggle'

let mockComputedColorScheme: 'light' | 'dark' = 'light'
const mockSetColorScheme = vi.fn()

// Partial mock - only mock the hooks we need
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core')
  return {
    ...actual,
    ActionIcon: vi.fn(
      ({
        children,
        onClick,
        'aria-label': ariaLabel,
        suppressHydrationWarning,
        ...props
      }) => (
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          data-testid="theme-toggle"
          suppressHydrationWarning={suppressHydrationWarning}
          {...props}
        >
          {children}
        </button>
      )
    ),
    useMantineColorScheme: () => ({
      setColorScheme: mockSetColorScheme
    }),
    useComputedColorScheme: () => mockComputedColorScheme
  }
})

vi.mock('@tabler/icons-react', () => ({
  IconMoon: vi.fn(({...props}) => <span data-testid="moon" {...props} />),
  IconSun: vi.fn(({...props}) => <span data-testid="sun" {...props} />)
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockComputedColorScheme = 'light'
    mockSetColorScheme.mockClear()
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)

    const button = screen.getByTestId('theme-toggle')
    expect(button).toBeInTheDocument()
  })

  it('renders sun and moon icons', () => {
    render(<ThemeToggle />)

    expect(screen.getByTestId('sun')).toBeInTheDocument()
    expect(screen.getByTestId('moon')).toBeInTheDocument()
  })

  it.each([
    {
      scheme: 'light' as const,
      expectedLabel: 'Switch to dark mode',
      expectedNextScheme: 'dark'
    },
    {
      scheme: 'dark' as const,
      expectedLabel: 'Switch to light mode',
      expectedNextScheme: 'light'
    }
  ])(
    'shows "$expectedLabel" and switches to $expectedNextScheme when currently $scheme',
    async ({scheme, expectedLabel, expectedNextScheme}) => {
      mockComputedColorScheme = scheme

      render(<ThemeToggle />)

      const button = screen.getByTestId('theme-toggle')
      expect(button).toHaveAttribute('aria-label', expectedLabel)

      await userEvent.click(button)

      expect(mockSetColorScheme).toHaveBeenCalledWith(expectedNextScheme)
    }
  )
})
