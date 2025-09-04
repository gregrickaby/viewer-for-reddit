import {logError} from './logError'

describe('logError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs Error instance with message', () => {
    const error = new Error('fail')
    logError(error)
    expect(console.error).toHaveBeenCalledWith('Error: fail')
  })

  it('logs string error', () => {
    logError('fail')
    expect(console.error).toHaveBeenCalledWith('Error: fail')
  })

  it('logs number error', () => {
    logError(123)
    expect(console.error).toHaveBeenCalledWith('Error: 123')
  })

  it('logs object error', () => {
    logError({foo: 'bar'})
    expect(console.error).toHaveBeenCalledWith('Error: [object Object]')
  })
})
