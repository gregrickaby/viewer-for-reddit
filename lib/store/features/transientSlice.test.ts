import transientReducer, {
  selectNavbar,
  selectSearch,
  selectSearchQuery,
  setSearchQuery,
  toggleNavbar,
  toggleSearch
} from './transientSlice'

const baseState = {
  toggleNavbar: false,
  toggleSearch: false,
  searchQuery: ''
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

  it('setSearchQuery sets the search query', () => {
    let state = {...baseState, searchQuery: ''}
    state = transientReducer(state, setSearchQuery('reactjs'))
    expect(state.searchQuery).toBe('reactjs')
    state = transientReducer(state, setSearchQuery(''))
    expect(state.searchQuery).toBe('')
  })

  it('selectSearchQuery selector returns searchQuery', () => {
    const root = {transient: {...baseState, searchQuery: 'foo'}}
    expect(selectSearchQuery(root as any)).toBe('foo')
  })
})
