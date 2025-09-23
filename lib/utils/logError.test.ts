import {logError} from './logError'

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log Error instance with message', () => {
    const error = new Error('fail')
    logError(error)
    expect(console.error).toHaveBeenCalledWith('Error: fail')
  })

  it('should log string error', () => {
    logError('fail')
    expect(console.error).toHaveBeenCalledWith('Error: fail')
  })

  it('should log number error', () => {
    logError(123)
    expect(console.error).toHaveBeenCalledWith('Error: 123')
  })

  it('should log RTK Query errors with status and data', () => {
    const rtkError = {status: 500, data: 'Internal Server Error'}
    logError(rtkError)
    expect(console.error).toHaveBeenCalledWith(
      'Error: 500 - "Internal Server Error"'
    )
  })

  it('should log objects with message property', () => {
    const errorObj = {message: 'Custom error', code: 123}
    logError(errorObj)
    expect(console.error).toHaveBeenCalledWith('Error: Custom error')
  })

  it('should log generic objects as JSON', () => {
    logError({foo: 'bar'})
    expect(console.error).toHaveBeenCalledWith('Error: {"foo":"bar"}')
  })

  it('should log null and undefined', () => {
    logError(null)
    expect(console.error).toHaveBeenCalledWith('Error: null')

    logError(undefined)
    expect(console.error).toHaveBeenCalledWith('Error: undefined')
  })
})
