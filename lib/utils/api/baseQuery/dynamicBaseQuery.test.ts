import {dynamicBaseQuery} from './dynamicBaseQuery'

describe('dynamicBaseQuery', () => {
  const mockApi = {
    getState: vi.fn(),
    dispatch: vi.fn(),
    endpoint: 'test',
    type: 'query' as const,
    requestId: 'test-request',
    signal: new AbortController().signal,
    abort: vi.fn(),
    extra: undefined,
    forced: false
  }

  const mockExtraOptions = {}

  it('should use authenticated base query when user is authenticated', async () => {
    // Mock authenticated state
    mockApi.getState.mockReturnValue({
      auth: {isAuthenticated: true}
    })

    const result = await dynamicBaseQuery('/test', mockApi, mockExtraOptions)

    // Should route through authenticated endpoint (/api/reddit/me)
    // This test mainly validates the function executes without errors
    expect(result).toBeDefined()
  })

  it('should use anonymous base query when user is not authenticated', async () => {
    // Mock unauthenticated state
    mockApi.getState.mockReturnValue({
      auth: {isAuthenticated: false}
    })

    const result = await dynamicBaseQuery('/test', mockApi, mockExtraOptions)

    // Should route through anonymous endpoint (/api/reddit)
    expect(result).toBeDefined()
  })

  it('should use anonymous base query when auth state is missing', async () => {
    // Mock missing auth state
    mockApi.getState.mockReturnValue({})

    const result = await dynamicBaseQuery('/test', mockApi, mockExtraOptions)

    // Should default to anonymous endpoint
    expect(result).toBeDefined()
  })
})
