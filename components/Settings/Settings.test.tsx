import {Settings} from '@/components/Settings/Settings'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'

const {mockDispatch, mockSetColorScheme, mockShowNotification, switchHandlers} =
  vi.hoisted(() => ({
    mockDispatch: vi.fn(),
    mockSetColorScheme: vi.fn(),
    mockShowNotification: vi.fn(),
    switchHandlers: {} as Record<string, any>
  }))

vi.mock('@mantine/notifications', () => ({
  showNotification: mockShowNotification
}))

vi.mock('@/lib/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) =>
    selector({settings: {enableNsfw: false, isMuted: false}})
}))

vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual<any>('@mantine/core')
  return {
    ...actual,
    useMantineColorScheme: () => ({
      colorScheme: 'light',
      setColorScheme: mockSetColorScheme
    }),
    Switch: ({label, checked, onChange}: any) => {
      switchHandlers[label] = onChange
      return (
        <label>
          <input
            type="checkbox"
            aria-label={label}
            checked={checked}
            onChange={onChange}
          />
        </label>
      )
    }
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Settings', () => {
  it('handles menu actions', async () => {
    const user = userEvent.setup()
    render(<Settings />)

    // open menu
    await user.click(screen.getByLabelText('Settings'))

    // toggles
    await user.click(screen.getByLabelText('Allow NSFW'))
    switchHandlers['Dark Mode']({currentTarget: {checked: true}})
    switchHandlers['Dark Mode']({currentTarget: {checked: false}})
    await user.click(screen.getByLabelText('Mute'))

    // delete recently viewed
    await user.click(screen.getByText('Delete Recently Viewed'))
    await user.click(screen.getByLabelText('Settings'))

    // delete favorites
    await user.click(screen.getByText('Delete All Favorites'))
    await user.click(screen.getByLabelText('Settings'))

    // reset all data
    await user.click(screen.getByText('Reset All Data'))

    expect(mockDispatch).toHaveBeenCalledTimes(5)
    expect(mockSetColorScheme).toHaveBeenNthCalledWith(1, 'dark')
    expect(mockSetColorScheme).toHaveBeenNthCalledWith(2, 'light')
    expect(mockShowNotification).toHaveBeenCalledTimes(3)
  })
})
