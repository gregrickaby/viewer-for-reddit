import {act, mockPreloadedState, renderHook} from '@/test-utils'
import {useRemoveItemFromHistory} from './useRemoveItemFromHistory'

const preloadedState = {
  ...mockPreloadedState,
  settings: {
    ...mockPreloadedState.settings,
    recent: [
      {
        display_name: 'reactjs',
        icon_img: '',
        over18: false,
        public_description: 'React community',
        subscribers: 100000,
        value: 'r/reactjs'
      },
      {
        display_name: 'aww',
        icon_img: '',
        over18: false,
        public_description: 'Cute stuff',
        subscribers: 123,
        value: 'r/aww'
      }
    ]
  }
}

describe('useRemoveItemFromHistory', () => {
  it('removes an item from recent history and shows notification', () => {
    const {result, store} = renderHook(() => useRemoveItemFromHistory(), {
      preloadedState
    })
    act(() => {
      result.current.remove('reactjs')
    })
    const state = store.getState()
    expect(
      state.settings.recent.some((s) => s.display_name === 'reactjs')
    ).toBe(false)
    expect(state.settings.recent.some((s) => s.display_name === 'aww')).toBe(
      true
    )
  })

  it('does nothing if displayName is empty', () => {
    const {result, store} = renderHook(() => useRemoveItemFromHistory(), {
      preloadedState
    })
    act(() => {
      result.current.remove('')
    })
    // State should be unchanged
    const state = store.getState()
    expect(state.settings.recent.length).toBe(2)
  })
})
