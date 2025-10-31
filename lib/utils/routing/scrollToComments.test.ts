import {scrollToComments} from './scrollToComments'

describe('scrollToComments', () => {
  let mockScrollIntoView: ReturnType<typeof vi.fn>
  let mockScrollTo: ReturnType<typeof vi.fn>
  let mockElement: HTMLElement

  beforeEach(() => {
    mockScrollIntoView = vi.fn()
    mockScrollTo = vi.fn()
    mockElement = document.createElement('div')
    mockElement.id = 'comments'
    mockElement.scrollIntoView = mockScrollIntoView as unknown as (
      arg?: boolean | ScrollIntoViewOptions
    ) => void

    // Mock getBoundingClientRect
    vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 1000,
      left: 0,
      right: 0,
      width: 0,
      height: 500,
      x: 0,
      y: 500,
      toJSON: () => ({})
    })

    // Mock window.scrollY and window.scrollTo
    Object.defineProperty(globalThis.window, 'scrollY', {
      value: 100,
      writable: true,
      configurable: true
    })
    globalThis.window.scrollTo =
      mockScrollTo as unknown as typeof globalThis.window.scrollTo

    // Add element to document
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    globalThis.window.location.hash = ''
  })

  it('should return false if no hash is present', () => {
    globalThis.location.hash = ''

    const result = scrollToComments()

    expect(result).toBe(false)
    expect(mockScrollIntoView).not.toHaveBeenCalled()
    expect(mockScrollTo).not.toHaveBeenCalled()
  })

  it('should return false if hash is not #comments', () => {
    globalThis.location.hash = '#other'

    const result = scrollToComments()

    expect(result).toBe(false)
    expect(mockScrollIntoView).not.toHaveBeenCalled()
    expect(mockScrollTo).not.toHaveBeenCalled()
  })

  it('should return false if comments element not found', () => {
    globalThis.location.hash = '#comments'
    document.body.innerHTML = '' // Remove the element

    const result = scrollToComments()

    expect(result).toBe(false)
    expect(mockScrollIntoView).not.toHaveBeenCalled()
    expect(mockScrollTo).not.toHaveBeenCalled()
  })

  it('should scroll to comments with default offset', () => {
    globalThis.location.hash = '#comments'

    const result = scrollToComments()

    expect(result).toBe(true)
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    })

    // scrollY (100) + rect.top (500) - headerHeight (60) - offset (100) = 440
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 440,
      behavior: 'smooth'
    })
  })

  it('should scroll to comments with custom header height and offset', () => {
    globalThis.location.hash = '#comments'

    const result = scrollToComments({
      headerHeight: 80,
      offset: 50
    })

    expect(result).toBe(true)

    // scrollY (100) + rect.top (500) - headerHeight (80) - offset (50) = 470
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 470,
      behavior: 'smooth'
    })
  })

  it('should use auto scroll behavior when specified', () => {
    globalThis.location.hash = '#comments'

    const result = scrollToComments({behavior: 'auto'})

    expect(result).toBe(true)
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'start',
      inline: 'nearest'
    })
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 440,
      behavior: 'auto'
    })
  })

  it('should handle zero offset', () => {
    globalThis.location.hash = '#comments'

    const result = scrollToComments({
      headerHeight: 60,
      offset: 0
    })

    expect(result).toBe(true)

    // scrollY (100) + rect.top (500) - headerHeight (60) - offset (0) = 540
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 540,
      behavior: 'smooth'
    })
  })
})
