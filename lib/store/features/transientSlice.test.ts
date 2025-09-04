import transientReducer, {
  selectNavbar,
  selectSearch,
  toggleNavbar,
  toggleSearch
} from './transientSlice'

const baseState = {
  toggleNavbar: false,
  toggleSearch: false
}

describe('transientSlice', () => {
  it('should return initial state', () => {
    expect(transientReducer(undefined, {type: undefined as any})).toEqual(
      baseState
    )
  })

  it('toggleNavbar toggles the value', () => {
    let state = {...baseState, toggleNavbar: false}
    state = transientReducer(state, toggleNavbar())
    expect(state.toggleNavbar).toBe(true)
    state = transientReducer(state, toggleNavbar())
    expect(state.toggleNavbar).toBe(false)
  })

  it('toggleSearch toggles the value', () => {
    let state = {...baseState, toggleSearch: false}
    state = transientReducer(state, toggleSearch())
    expect(state.toggleSearch).toBe(true)
    state = transientReducer(state, toggleSearch())
    expect(state.toggleSearch).toBe(false)
  })

  it('selectNavbar selector returns toggleNavbar', () => {
    const root = {transient: {...baseState, toggleNavbar: true}}
    expect(selectNavbar(root as any)).toBe(true)
  })

  it('selectSearch selector returns toggleSearch', () => {
    const root = {transient: {...baseState, toggleSearch: true}}
    expect(selectSearch(root as any)).toBe(true)
  })
})
