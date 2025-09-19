'use client'

import {SubredditName} from '@/components/SubredditName/SubredditName'
import {useHeaderState} from '@/lib/hooks/useHeaderState'
import {useSubredditSearch} from '@/lib/hooks/useSubredditSearch'
import {addToSearchHistory} from '@/lib/store/features/settingsSlice'
import {useAppDispatch} from '@/lib/store/hooks'
import type {SubredditItem} from '@/lib/types'
import {
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import {useClickOutside} from '@mantine/hooks'
import Link from 'next/link'
import {useCallback, useState} from 'react'
import classes from './Search.module.css'

export function Search() {
  const {query, setQuery, groupedData} = useSubredditSearch()
  const {showNavbar, toggleNavbarHandler} = useHeaderState()
  const dispatch = useAppDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const clickOutsideRef = useClickOutside(() => setDropdownOpen(false))

  const handleOptionClick = useCallback(
    (item: SubredditItem) => {
      // Add to search history
      dispatch(addToSearchHistory(item))
      
      // Update query
      setQuery(item.value)
      setDropdownOpen(false)
      
      // Handle navbar if needed
      if (showNavbar) {
        toggleNavbarHandler()
      }
    },
    [dispatch, setQuery, showNavbar, toggleNavbarHandler]
  )

  const handleOptionKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, item: SubredditItem) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleOptionClick(item)
      }
    },
    [handleOptionClick]
  )

  const renderSection = (title: string, items: SubredditItem[], showNsfwLabel = false) => {
    if (items.length === 0) return null

    return (
      <>
        <Text size="sm" fw={500} c="dimmed" px="md" py="xs">
          {title}
        </Text>
        {items.map((item) => (
          <div
            key={item.value}
            role="button"
            tabIndex={0}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '4px',
              margin: '0 8px'
            }}
            onClick={() => handleOptionClick(item)}
            onKeyDown={(e) => handleOptionKeyDown(e, item)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <Group wrap="nowrap" justify="space-between">
              <Link href={`/${item.value}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <SubredditName
                  icon={item.icon_img}
                  name={item.display_name}
                  enableFavorite
                />
              </Link>
              {showNsfwLabel && item.over18 && (
                <Text size="xs" c="red" fw={500}>
                  NSFW
                </Text>
              )}
            </Group>
          </div>
        ))}
        <Divider my="xs" />
      </>
    )
  }

  const hasAnyResults = 
    groupedData.communities.length > 0 ||
    groupedData.nsfw.length > 0 ||
    groupedData.searchHistory.length > 0

  return (
    <div ref={clickOutsideRef} style={{ position: 'relative' }}>
      <TextInput
        className={classes.root}
        placeholder="Search subreddits"
        size="lg"
        value={query}
        onChange={(event) => {
          setQuery(event.currentTarget.value)
          setDropdownOpen(true)
        }}
        onFocus={() => setDropdownOpen(true)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Search subreddits"
        rightSection={query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      />

      {dropdownOpen && (
        <Paper
          shadow="md"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: '4px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
          className={classes.dropdown}
        >
          {!hasAnyResults ? (
            <Text p="md" c="dimmed">
              No results found
            </Text>
          ) : (
            <Stack gap={0}>
              {renderSection('Communities', groupedData.communities)}
              {renderSection('NSFW', groupedData.nsfw, true)}
              {renderSection('Search History', groupedData.searchHistory)}
            </Stack>
          )}
        </Paper>
      )}
    </div>
  )
}
