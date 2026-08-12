'use client'

import {Button, Menu} from '@mantine/core'
import {IconCheck, IconChevronDown} from '@tabler/icons-react'
import {ReactNode} from 'react'

export interface SortTabOption {
  /** Value passed to onChange when this option is selected */
  value: string
  /** Visible option label */
  label: string
  /** Icon rendered to the left of the label */
  icon?: ReactNode
}

interface SortTabsProps {
  /** Currently active option value */
  value: string
  /** Called with the new value when the user selects a different option */
  onChange: (value: string) => void
  /** Disables the trigger, e.g. while a navigation transition is pending */
  disabled?: boolean
  /** Options to render, in order */
  tabs: SortTabOption[]
  /** Accessible label for the trigger button, prefixed to the active option's name */
  ariaLabel?: string
}

/**
 * Dropdown sort-option menu shared by the post/comment list components and
 * their time-filter rows, matching reddit.com's sort control.
 */
export function SortTabs({
  value,
  onChange,
  disabled = false,
  tabs,
  ariaLabel = 'Sort by'
}: Readonly<SortTabsProps>) {
  const activeTab = tabs.find((tab) => tab.value === value)

  return (
    <Menu shadow="md" withinPortal transitionProps={{duration: 0}}>
      <Menu.Target>
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          fw={700}
          disabled={disabled}
          aria-label={`${ariaLabel} ${activeTab?.label ?? ''}`}
          rightSection={<IconChevronDown aria-hidden="true" size={14} />}
        >
          {activeTab?.label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {tabs.map((tab) => (
          <Menu.Item
            key={tab.value}
            leftSection={tab.icon}
            rightSection={
              tab.value === value ? (
                <IconCheck aria-hidden="true" size={14} />
              ) : undefined
            }
            onClick={() => tab.value !== value && onChange(tab.value)}
          >
            {tab.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

/** Shared time-filter options for `top`/`controversial` sorts. */
export const TIME_FILTER_TABS: SortTabOption[] = [
  {value: 'hour', label: 'Hour'},
  {value: 'day', label: 'Day'},
  {value: 'week', label: 'Week'},
  {value: 'month', label: 'Month'},
  {value: 'year', label: 'Year'},
  {value: 'all', label: 'All Time'}
]
