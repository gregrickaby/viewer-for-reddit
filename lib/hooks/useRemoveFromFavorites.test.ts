import {useRemoveFromFavorites} from '@/lib/hooks/useRemoveFromFavorites'
import {clearSingleFavorite} from '@/lib/store/features/settingsSlice'
import {renderHook} from '@/test-utils'
import {showNotification} from '@mantine/notifications'

vi.mock('@mantine/notifications', () => ({
  showNotification: vi.fn()
}))

const dispatchMock = vi.fn()
vi.mock('@/lib/store/hooks', () => ({
  useAppDispatch: () => dispatchMock
}))

describe('useRemoveFromFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should dispatch clearSingleFavorite and show notification', () => {
    const {result} = renderHook(() => useRemoveFromFavorites())

    result.current.remove('testsubreddit')

    expect(dispatchMock).toHaveBeenCalledWith(
      clearSingleFavorite('testsubreddit')
    )
    expect(showNotification).toHaveBeenCalledWith({
      title: 'Deleted',
      message: 'r/testsubreddit removed from favorites.',
      color: 'red'
    })
  })

  it('should do nothing when displayName is empty', () => {
    const {result} = renderHook(() => useRemoveFromFavorites())

    result.current.remove('')

    expect(dispatchMock).not.toHaveBeenCalled()
    expect(showNotification).not.toHaveBeenCalled()
  })
})
