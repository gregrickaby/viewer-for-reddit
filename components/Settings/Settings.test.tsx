import {Settings} from '@/components/Settings/Settings'
import {render, screen} from '@/test-utils'

vi.mock('@mantine/notifications', () => ({
  showNotification: vi.fn()
}))

vi.mock('@/lib/store/hooks', () => ({
  useAppDispatch: () => vi.fn(),
  useAppSelector: () => false
}))

vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<any>('@mantine/core')
  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: 'light',
      setColorScheme: vi.fn()
    })
  }
})

describe('Settings', () => {
  it('renders settings button', () => {
    render(<Settings />)
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
  })
})
