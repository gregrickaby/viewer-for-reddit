'use client'

import {SubredditName} from '@/components/SubredditName/SubredditName'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import type {SubredditItem} from '@/lib/types'
import {
  ActionIcon,
  Combobox,
  Group,
  InputBase,
  Loader,
  Text,
  useCombobox
} from '@mantine/core'
import Link from 'next/link'
import {FaSearch} from 'react-icons/fa'
import {IoMdArrowBack, IoMdClose} from 'react-icons/io'
import styles from './Search.module.css'

/**
 * Search Component
 *
 * Presentational search input and dropdown for subreddit discovery in Viewer for Reddit.
 *
 * Features:
 * - Mantine v8 Combobox with grouped options (Communities, NSFW, Search History)
 * - Business logic handled by useSubredditSearch hook for clean separation of concerns
 * - Keyboard and mouse navigation with full accessibility support
 * - Clear/remove actions for search history management
 * - Subreddit icons, names, NSFW badges, and removal controls
 * - Empty state and error handling for robust UX
 * - Responsive mobile/desktop behavior with proper animations
 */
export function Search() {
  const {
    query,
    setQuery,
    filteredGroups,
    totalOptions,
    handleOptionSelect,
    handleRemoveFromHistory,
    isLoading,
    hasError,
    hasNoResults,
    isMobile,
    handleMobileClose,
    handleMobileSearchClick,
    mobileInputRef,
    isClosing
  } = useSubredditSearch()

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  /**
   * Calculate dropdown className based on mobile state and animations
   * Provides smooth transitions for mobile drawer behavior
   */
  const getDropdownClassName = () => {
    if (isMobile) {
      return isClosing
        ? `${styles.dropdownMobile} ${styles.dropdownMobileClosing}`
        : styles.dropdownMobile
    }
    return styles.dropdownDesktop
  }

  const groups = filteredGroups.map((group) => {
    const options = group.options.map((item: SubredditItem) => (
      <Combobox.Option value={item.value} key={item.value}>
        <Group wrap="nowrap" justify="space-between">
          <Link
            href={`/${item.value}`}
            style={{textDecoration: 'none', color: 'inherit', flex: 1}}
          >
            <SubredditName
              enableFavorite
              icon={item.icon_img}
              name={item.display_name}
            />
          </Link>
          <Group wrap="nowrap" gap="xs">
            {group.label === 'NSFW' && item.over18 && (
              <Text size="xs" c="red" fw={500} className={styles.nsfwText}>
                NSFW
              </Text>
            )}
            {group.label === 'Search History' && (
              <ActionIcon
                aria-label={`Remove ${item.display_name} from search history`}
                color="gray"
                size="sm"
                variant="subtle"
                onClick={(event) =>
                  handleRemoveFromHistory(event, item.display_name)
                }
              >
                <IoMdClose size={14} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </Combobox.Option>
    ))

    return (
      <Combobox.Group label={group.label} key={group.label}>
        {options}
      </Combobox.Group>
    )
  })

  return (
    <div className={styles.search}>
      <Combobox
        onOptionSubmit={handleOptionSelect}
        store={combobox}
        withinPortal
      >
        {isMobile ? (
          // Mobile: Search icon trigger with proper alignment
          <Combobox.Target>
            <div className={styles.mobileSearchTrigger}>
              <ActionIcon
                aria-label={
                  combobox.dropdownOpened ? 'Close search' : 'Open search'
                }
                color="gray"
                size="lg"
                variant="subtle"
                onClick={() => handleMobileSearchClick(combobox)}
              >
                <FaSearch size={18} />
              </ActionIcon>
            </div>
          </Combobox.Target>
        ) : (
          // Tablet/Desktop: Search input in header
          <Combobox.Target>
            <InputBase
              aria-label="Search subreddits"
              autoCapitalize="off"
              autoCorrect="off"
              classNames={{input: styles.searchInput}}
              placeholder="Search subreddits"
              size="md"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                combobox.openDropdown()
                combobox.updateSelectedOptionIndex()
                setQuery(event.currentTarget.value)
              }}
              onClick={() => combobox.openDropdown()}
              onFocus={() => combobox.openDropdown()}
              onBlur={() => combobox.closeDropdown()}
              rightSectionPointerEvents="auto"
              rightSection={
                query ? (
                  <ActionIcon
                    aria-label="Clear search"
                    color="gray"
                    onClick={() => setQuery('')}
                    size="sm"
                    variant="subtle"
                  >
                    <IoMdClose size={16} />
                  </ActionIcon>
                ) : (
                  <ActionIcon
                    aria-label="Search"
                    color="gray"
                    size="sm"
                    variant="subtle"
                  >
                    <FaSearch size={14} />
                  </ActionIcon>
                )
              }
            />
          </Combobox.Target>
        )}

        {/* Mobile and Desktop dropdowns */}
        <Combobox.Dropdown className={getDropdownClassName()}>
          {isMobile && (
            <>
              {/* Mobile: Header with back arrow and search input */}
              <div className={styles.mobileHeader}>
                <ActionIcon
                  aria-label="Back"
                  color="gray"
                  size="md"
                  variant="subtle"
                  onClick={() => {
                    combobox.closeDropdown()
                    handleMobileClose()
                  }}
                >
                  <IoMdArrowBack size={20} />
                </ActionIcon>
                <InputBase
                  ref={mobileInputRef}
                  aria-label="Search subreddits"
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder="Search Reddit"
                  size="md"
                  spellCheck={false}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.currentTarget.value)
                  }}
                  className={styles.mobileSearchInput}
                  classNames={{
                    input: styles.mobileSearchInputBase
                  }}
                />
              </div>
            </>
          )}{' '}
          <div className={isMobile ? styles.mobileSearchResults : undefined}>
            <Combobox.Options>
              {(() => {
                if (isLoading) {
                  return (
                    <div className={styles.loadingContainer}>
                      <Loader size="sm" />
                    </div>
                  )
                }

                if (hasError) {
                  return (
                    <Combobox.Empty>
                      Unable to load search results. Please try again.
                    </Combobox.Empty>
                  )
                }

                if (totalOptions > 0) {
                  return groups
                }

                if (hasNoResults) {
                  return <Combobox.Empty>No results found</Combobox.Empty>
                }

                return null
              })()}
            </Combobox.Options>
          </div>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}
