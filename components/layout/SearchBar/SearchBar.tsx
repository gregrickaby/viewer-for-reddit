'use client'

import {useSearch} from '@/lib/hooks'
import {
  Avatar,
  Badge,
  Combobox,
  Divider,
  Group,
  InputBase,
  Loader,
  Modal,
  Stack,
  Text,
  useCombobox
} from '@mantine/core'
import {useMediaQuery} from '@mantine/hooks'
import {IconSearch} from '@tabler/icons-react'
import {useEffect, useRef} from 'react'

/**
 * Props for the SearchBar component.
 */
interface SearchBarProps {
  /** Whether mobile search overlay is open */
  mobileOpen?: boolean
  /** Callback to close mobile search overlay */
  onMobileClose?: () => void
}

/**
 * Search bar with typeahead subreddit suggestions.
 * Uses Mantine Combobox for dropdown suggestions.
 *
 * Features:
 * - Typeahead search (min 2 characters)
 * - Grouped results (Communities and NSFW)
 * - Keyboard navigation (/, Enter, Escape)
 * - Loading and error states
 * - Subreddit avatars and member counts
 * - Press '/' to focus from anywhere
 *
 * @example
 * ```typescript
 * <SearchBar
 *   mobileOpen={false}
 *   onMobileClose={() => setOpen(false)}
 * />
 * ```
 */
export function SearchBar({
  mobileOpen = false,
  onMobileClose
}: Readonly<SearchBarProps> = {}) {
  const {
    query,
    setQuery,
    groupedResults,
    isLoading,
    hasError,
    errorMessage,
    handleOptionSelect,
    handleSubmit
  } = useSearch()
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const isMobile = useMediaQuery('(max-width: 48em)') // sm breakpoint

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
        combobox.openDropdown()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [combobox])

  // Auto-focus input when mobile search opens
  useEffect(() => {
    if (mobileOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mobileOpen])

  const handleSelect = (value: string) => {
    handleOptionSelect(value)
    combobox.closeDropdown()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (query) {
        setQuery('')
        combobox.closeDropdown()
      } else if (isMobile && onMobileClose) {
        onMobileClose()
      }
    }

    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      handleSubmit()
      combobox.closeDropdown()
      if (isMobile && onMobileClose) {
        onMobileClose()
      }
    }
  }

  const {communities, nsfw} = groupedResults
  const hasResults = communities.length > 0 || nsfw.length > 0
  const showDropdown = query.length >= 2 || isLoading
  const shouldShowNoResults =
    query.length >= 2 && !isLoading && !hasError && !hasResults

  const searchInput = (
    <Combobox
      store={combobox}
      onOptionSubmit={handleSelect}
      withinPortal
      position="bottom-start"
    >
      <Combobox.Target>
        <InputBase
          id="reddit-search-input"
          ref={inputRef}
          leftSection={<IconSearch size={16} />}
          rightSection={isLoading ? <Loader size={16} /> : null}
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value)
            combobox.openDropdown()
            combobox.updateSelectedOptionIndex()
          }}
          onKeyDown={handleKeyDown}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          placeholder={
            isMobile ? 'Search...' : 'Search Reddit... (Press / to focus)'
          }
          aria-label="Search Reddit or subreddits"
          aria-expanded={showDropdown}
          aria-controls="search-dropdown"
          w={isMobile ? '100%' : 300}
          size={isMobile ? 'md' : 'sm'}
          data-umami-event="search"
        />
      </Combobox.Target>

      <Combobox.Dropdown
        hidden={!showDropdown}
        id="search-dropdown"
        aria-live="polite"
        aria-atomic="true"
      >
        <Combobox.Options>
          {isLoading && (
            <Combobox.Empty>
              <Group justify="center" p="xs">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  Searching...
                </Text>
              </Group>
            </Combobox.Empty>
          )}

          {!isLoading && hasError && (
            <Combobox.Empty>
              <Text size="sm" c="red">
                {errorMessage || 'Error loading results'}
              </Text>
            </Combobox.Empty>
          )}

          {shouldShowNoResults && (
            <Combobox.Empty>
              <Text size="sm" c="dimmed">
                No subreddits found for "{query}"
              </Text>
            </Combobox.Empty>
          )}

          {!isLoading && !hasError && hasResults && (
            <>
              {communities.length > 0 && (
                <>
                  <Text size="xs" c="dimmed" px="sm" py={4} fw={600}>
                    COMMUNITIES
                  </Text>
                  {communities.map((item) => (
                    <Combobox.Option value={item.displayName} key={item.name}>
                      <Group wrap="nowrap" gap="sm">
                        <Avatar
                          src={item.icon}
                          size={24}
                          radius="sm"
                          alt={item.displayName}
                        />
                        <Stack gap={0}>
                          <Text size="sm" fw={500}>
                            {item.displayName}
                          </Text>
                          {item.subscribers && item.subscribers > 0 && (
                            <Text size="xs" c="dimmed">
                              {item.subscribers.toLocaleString()} members
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Combobox.Option>
                  ))}
                </>
              )}

              {communities.length > 0 && nsfw.length > 0 && <Divider my="xs" />}

              {nsfw.length > 0 && (
                <>
                  <Text size="xs" c="dimmed" px="sm" py={4} fw={600}>
                    NSFW
                  </Text>
                  {nsfw.map((item) => (
                    <Combobox.Option value={item.displayName} key={item.name}>
                      <Group wrap="nowrap" gap="sm">
                        <Avatar
                          src={item.icon}
                          size={24}
                          radius="sm"
                          alt={item.displayName}
                        />
                        <Stack gap={0}>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>
                              {item.displayName}
                            </Text>
                            <Badge size="xs" color="red" variant="filled">
                              NSFW
                            </Badge>
                          </Group>
                          {item.subscribers && item.subscribers > 0 && (
                            <Text size="xs" c="dimmed">
                              {item.subscribers.toLocaleString()} members
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Combobox.Option>
                  ))}
                </>
              )}
            </>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )

  // On mobile, render inside a Modal
  if (isMobile) {
    return (
      <Modal
        opened={mobileOpen}
        onClose={() => onMobileClose?.()}
        withCloseButton={false}
        size="xl"
        padding="lg"
      >
        {searchInput}
      </Modal>
    )
  }

  // On desktop, render inline
  return searchInput
}
