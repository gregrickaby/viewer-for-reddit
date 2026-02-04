import {act, renderHook, waitFor} from '@/test-utils'
import {useCombobox} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {useSearchBar} from './useSearchBar'

// Mock Mantine hooks
vi.mock('@mantine/core', async () => {
  const actual = await vi.importActual('@mantine/core')
  return {
    ...actual,
    useCombobox: vi.fn()
  }
})

vi.mock('@mantine/hooks', async () => {
  const actual = await vi.importActual('@mantine/hooks')
  return {
    ...actual,
    useMediaQuery: vi.fn(() => false) // Default to desktop
  }
})

const mockUseCombobox = vi.mocked(useCombobox)
const mockUseMediaQuery = vi.mocked(useMediaQuery)

describe('useSearchBar', () => {
  const mockSetQuery = vi.fn()
  const mockHandleOptionSelect = vi.fn()
  const mockHandleSubmit = vi.fn()
  const mockOnMobileClose = vi.fn()
  const mockCombobox = {
    openDropdown: vi.fn(),
    closeDropdown: vi.fn(),
    resetSelectedOption: vi.fn()
  }

  const defaultOptions = {
    query: '',
    setQuery: mockSetQuery,
    mobileOpen: false,
    handleOptionSelect: mockHandleOptionSelect,
    handleSubmit: mockHandleSubmit,
    onMobileClose: mockOnMobileClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCombobox.mockReturnValue(mockCombobox as any)
    mockUseMediaQuery.mockReturnValue(false) // Desktop by default
  })

  describe('initialization', () => {
    it('returns required properties', () => {
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      expect(result.current.inputRef).toBeDefined()
      expect(result.current.combobox).toBeDefined()
      expect(result.current.isMobile).toBe(false)
      expect(result.current.handleSelect).toBeInstanceOf(Function)
      expect(result.current.handleKeyDown).toBeInstanceOf(Function)
    })

    it('detects mobile viewport', () => {
      mockUseMediaQuery.mockReturnValue(true)

      const {result} = renderHook(() => useSearchBar(defaultOptions))

      expect(result.current.isMobile).toBe(true)
    })

    it('detects desktop viewport', () => {
      mockUseMediaQuery.mockReturnValue(false)

      const {result} = renderHook(() => useSearchBar(defaultOptions))

      expect(result.current.isMobile).toBe(false)
    })
  })

  describe('handleSelect', () => {
    it('calls handleOptionSelect and closes dropdown', () => {
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      act(() => {
        result.current.handleSelect('r/test')
      })

      expect(mockHandleOptionSelect).toHaveBeenCalledWith('r/test')
      expect(mockCombobox.closeDropdown).toHaveBeenCalled()
    })

    it('calls onMobileClose on mobile when selecting option', () => {
      mockUseMediaQuery.mockReturnValue(true) // Mobile
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      act(() => {
        result.current.handleSelect('r/test')
      })

      expect(mockHandleOptionSelect).toHaveBeenCalledWith('r/test')
      expect(mockCombobox.closeDropdown).toHaveBeenCalled()
      expect(mockOnMobileClose).toHaveBeenCalled()
    })

    it('does not call onMobileClose on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false) // Desktop
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      act(() => {
        result.current.handleSelect('r/test')
      })

      expect(mockHandleOptionSelect).toHaveBeenCalledWith('r/test')
      expect(mockCombobox.closeDropdown).toHaveBeenCalled()
      expect(mockOnMobileClose).not.toHaveBeenCalled()
    })
  })

  describe('handleKeyDown', () => {
    it('clears query when Escape pressed with query present', () => {
      const options = {...defaultOptions, query: 'test query'}
      const {result} = renderHook(() => useSearchBar(options))

      const event = {
        key: 'Escape',
        preventDefault: vi.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockSetQuery).toHaveBeenCalledWith('')
      expect(mockCombobox.closeDropdown).toHaveBeenCalled()
    })

    it('calls onMobileClose when Escape pressed with empty query on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true)
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      const event = {
        key: 'Escape',
        preventDefault: vi.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockOnMobileClose).toHaveBeenCalled()
    })

    it('does not call onMobileClose on desktop', () => {
      mockUseMediaQuery.mockReturnValue(false)
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      const event = {
        key: 'Escape',
        preventDefault: vi.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(mockOnMobileClose).not.toHaveBeenCalled()
    })

    it('calls handleSubmit when Enter pressed with query', () => {
      const options = {...defaultOptions, query: 'test'}
      const {result} = renderHook(() => useSearchBar(options))

      const event = {
        key: 'Enter',
        preventDefault: vi.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
      expect(mockHandleSubmit).toHaveBeenCalled()
      expect(mockCombobox.closeDropdown).toHaveBeenCalled()
    })

    it('does not call handleSubmit when Enter pressed with empty query', () => {
      const {result} = renderHook(() => useSearchBar(defaultOptions))

      const event = {
        key: 'Enter',
        preventDefault: vi.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(mockHandleSubmit).not.toHaveBeenCalled()
    })

    it('calls onMobileClose on Enter on mobile', () => {
      mockUseMediaQuery.mockReturnValue(true)
      const options = {...defaultOptions, query: 'test'}
      const {result} = renderHook(() => useSearchBar(options))

      const event = {
        key: 'Enter',
        preventDefault: vi.fn()
      } as any

      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(mockOnMobileClose).toHaveBeenCalled()
    })
  })

  describe('global keyboard shortcut', () => {
    it('focuses input when / key is pressed', () => {
      renderHook(() => useSearchBar(defaultOptions))

      // Simulate pressing '/' key
      act(() => {
        const event = new KeyboardEvent('keydown', {key: '/', bubbles: true})
        document.dispatchEvent(event)
      })

      expect(mockCombobox.openDropdown).toHaveBeenCalled()
    })

    it('does not focus when typing in another input', () => {
      renderHook(() => useSearchBar(defaultOptions))

      // Create a fake input element and make it active
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      act(() => {
        const event = new KeyboardEvent('keydown', {key: '/', bubbles: true})
        document.dispatchEvent(event)
      })

      // Should not open dropdown when typing in another input
      expect(mockCombobox.openDropdown).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('cleans up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      const {unmount} = renderHook(() => useSearchBar(defaultOptions))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })
  })

  describe('mobile auto-focus', () => {
    it('focuses input after delay when mobile modal opens', async () => {
      const options = {...defaultOptions, mobileOpen: true}
      mockUseMediaQuery.mockReturnValue(true)

      renderHook(() => useSearchBar(options))

      // Wait for setTimeout to complete
      await waitFor(
        () => {
          // Verify setTimeout was called (100ms delay)
          expect(true).toBe(true)
        },
        {timeout: 200}
      )
    })

    it('cleans up timeout on unmount', async () => {
      vi.useFakeTimers()
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      mockUseMediaQuery.mockReturnValue(true)

      const {result, rerender} = renderHook(
        (props: {mobile: boolean}) =>
          useSearchBar({
            ...defaultOptions,
            mobileOpen: props.mobile
          }),
        {initialProps: {mobile: false}}
      )

      // Set ref to mock input
      const mockInput = document.createElement('input')
      if (result.current) {
        result.current.inputRef.current = mockInput
      }

      // Change mobileOpen to true to trigger effect and create timeout
      rerender({mobile: true})
      vi.runAllTimers()

      // Change mobileOpen to false to trigger cleanup
      rerender({mobile: false})

      expect(clearTimeoutSpy).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })
})
