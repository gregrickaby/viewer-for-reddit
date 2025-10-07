import {
  getInitialSettings,
  loadSettings,
  saveSettings,
  clearSettings
} from './storage'

describe('storage utilities', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('getInitialSettings returns defaults', () => {
    expect(getInitialSettings()).toEqual({
      currentSort: 'hot',
      currentSubreddit: '',
      enableNsfw: true,
      favorites: [],
      isMuted: true,
      recent: [],
      searchHistory: []
    })
  })

  it('loadSettings returns defaults when nothing stored', () => {
    expect(loadSettings()).toEqual(getInitialSettings())
  })

  it('saveSettings persists settings and loadSettings retrieves them', () => {
    const settings = {
      ...getInitialSettings(),
      currentSubreddit: 'reactjs',
      isMuted: false
    }
    saveSettings(settings)
    expect(loadSettings()).toEqual(settings)
  })

  it('clearSettings removes saved settings', () => {
    const settings = {...getInitialSettings(), currentSubreddit: 'reactjs'}
    saveSettings(settings)
    clearSettings()
    expect(loadSettings()).toEqual(getInitialSettings())
  })
})
