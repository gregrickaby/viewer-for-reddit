'use client'

import {formatNumber} from '@/lib/utils/formatters'
import {useSearch, useSearchBar} from '@/lib/hooks'
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
  Text
} from '@mantine/core'
import {IconSearch} from '@tabler/icons-react'

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

  const {inputRef, combobox, isMobile, handleSelect, handleKeyDown} =
    useSearchBar({
      query,
      setQuery,
      mobileOpen,
      handleOptionSelect,
      handleSubmit,
      onMobileClose
    })

  const {communities, nsfw} = groupedResults
  const hasResults = communities.length > 0 || nsfw.length > 0
  const showDropdown = query.length >= 2 || isLoading
  // Show "no results" when: query is long enough, not loading, no error, and no results
  const shouldShowNoResults =
    query.length >= 2 && !isLoading && !hasError && !hasResults

  const searchInput = (
    <Combobox
      onOptionSubmit={handleSelect}
      position="bottom-start"
      store={combobox}
      withinPortal
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
          aria-describedby={hasError ? 'search-error' : undefined}
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
              <Text id="search-error" size="sm" c="red">
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
                              {formatNumber(item.subscribers)} members
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
                              {formatNumber(item.subscribers)} members
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
        zIndex={100}
      >
        {searchInput}
      </Modal>
    )
  }

  // On desktop, render inline
  return searchInput
}
