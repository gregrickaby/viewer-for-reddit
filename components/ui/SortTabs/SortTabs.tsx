'use client'

import {Tabs} from '@mantine/core'
import {ReactNode} from 'react'

export interface SortTabOption {
  /** Value passed to onChange when this tab is selected */
  value: string
  /** Visible tab label */
  label: string
  /** Icon rendered to the left of the label */
  icon?: ReactNode
}

interface SortTabsProps {
  /** Currently active tab value */
  value: string
  /** Called with the new value when the user selects a different tab */
  onChange: (value: string) => void
  /** Disables every tab, e.g. while a navigation transition is pending */
  disabled?: boolean
  /** Tabs to render, in order */
  tabs: SortTabOption[]
}

/**
 * Horizontally-scrollable sort-tab list shared by the post/comment list
 * components and their time-filter rows.
 */
export function SortTabs({
  value,
  onChange,
  disabled = false,
  tabs
}: Readonly<SortTabsProps>) {
  return (
    <Tabs
      value={value}
      onChange={(next) => next && next !== value && onChange(next)}
    >
      <Tabs.List grow={false} style={{flexWrap: 'nowrap', overflowX: 'auto'}}>
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.value}
            value={tab.value}
            leftSection={tab.icon}
            disabled={disabled}
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
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
