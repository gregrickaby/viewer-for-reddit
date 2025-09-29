import transientReducer, {
  selectMobileSearchState,
  selectNavbar,
  selectSearchQuery,
  setMobileSearchState,
  setSearchQuery,
  toggleNavbar,
  type MobileSearchState
} from './transientSlice'

interface TestState {
  toggleNavbar: boolean
  mobileSearchState: MobileSearchState
  searchQuery: string
}

const baseState: TestState = {
  toggleNavbar: false, // Updated to match new initial state
  mobileSearchState: 'closed',
  searchQuery: ''
}

describe('transientSlice', () => {
  it('should return initial state', () => {
    expect(transientReducer(undefined, {type: undefined as any})).toEqual(
      baseState
    )
  })

  it('toggleNavbar toggles the value', () => {
    let state: TestState = {...baseState, toggleNavbar: false}
    state = transientReducer(state, toggleNavbar())
    expect(state.toggleNavbar).toBe(true)
    state = transientReducer(state, toggleNavbar())
    expect(state.toggleNavbar).toBe(false)
  })

  it('setMobileSearchState sets the mobile search state', () => {
    let state: TestState = {...baseState, mobileSearchState: 'closed'}
    state = transientReducer(state, setMobileSearchState('open'))
    expect(state.mobileSearchState).toBe('open')
    state = transientReducer(state, setMobileSearchState('closing'))
    expect(state.mobileSearchState).toBe('closing')
  })

  it('selectNavbar selector returns toggleNavbar', () => {
    const root = {transient: {...baseState, toggleNavbar: true}}
    expect(selectNavbar(root as any)).toBe(true)
  })

  it('selectMobileSearchState selector returns mobileSearchState', () => {
    const root = {transient: {...baseState, mobileSearchState: 'open'}}
    expect(selectMobileSearchState(root as any)).toBe('open')
  })

  it('setSearchQuery sets the search query', () => {
    let state: TestState = {...baseState, searchQuery: ''}
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
