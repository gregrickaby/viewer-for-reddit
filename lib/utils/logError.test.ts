import {logError} from './logError'

describe('logError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should log Error instance with structured format', () => {
    const error = new Error('Something went wrong')
    error.stack = 'Error: Something went wrong\n    at test'

    logError(error)

    expect(console.error).toHaveBeenCalledWith(
      JSON.stringify(
        {
          timestamp: '2024-01-01T12:00:00.000Z',
          level: 'error',
          message: 'Something went wrong',
          error: {
            name: 'Error',
            message: 'Something went wrong',
            stack: 'Error: Something went wrong\n    at test'
          }
        },
        null,
        2
      )
    )
  })

  it('should log Error with context information', () => {
    const error = new Error('API failed')
    const context = {
      component: 'UserProfile',
      action: 'fetchUser',
      userId: '123'
    }

    logError(error, context)

    const logCall = JSON.parse((console.error as any).mock.calls[0][0])
    expect(logCall.context).toEqual(context)
    expect(logCall.message).toBe('API failed')
  })

  it('should log RTK Query errors with status and data', () => {
    const rtkError = {status: 500, data: {message: 'Internal Server Error'}}

    logError(rtkError)

    const logCall = JSON.parse((console.error as any).mock.calls[0][0])
    expect(logCall.message).toBe('API Error: 500')
    expect(logCall.error).toEqual({
      status: 500,
      data: {message: 'Internal Server Error'}
    })
  })

  it('should log objects with message property', () => {
    const errorObj = {message: 'Custom error', code: 'USER_001'}

    logError(errorObj)

    const logCall = JSON.parse((console.error as any).mock.calls[0][0])
    expect(logCall.message).toBe('Custom error')
    expect(logCall.error).toEqual({message: 'Custom error'})
  })

  it('should log generic objects', () => {
    const genericError = {foo: 'bar', baz: 123}

    logError(genericError)

    const logCall = JSON.parse((console.error as any).mock.calls[0][0])
    expect(logCall.message).toBe('Object error')
    expect(logCall.error).toEqual({data: genericError})
  })

  it('should log primitive values', () => {
    logError('Something failed')

    const logCall = JSON.parse((console.error as any).mock.calls[0][0])
    expect(logCall.message).toBe('Something failed')
    expect(logCall.error).toEqual({data: 'Something failed'})
  })

  it('should handle null and undefined', () => {
    logError(null)

    let logCall = JSON.parse((console.error as any).mock.calls[0][0])
    expect(logCall.message).toBe('null')
    expect(logCall.error).toEqual({data: null})

    logError(undefined)

    logCall = JSON.parse((console.error as any).mock.calls[1][0])
    expect(logCall.message).toBe('undefined')
    expect(logCall.error).toEqual({data: undefined})
  })
})
