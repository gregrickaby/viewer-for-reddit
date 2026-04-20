'use client'

import {useState} from 'react'
import {ActionIcon, Collapse, Group, Text} from '@mantine/core'
import {IconChevronDown, IconChevronUp, IconSettings} from '@tabler/icons-react'

/**
 * Props for the CollapsibleSection component.
 */
interface CollapsibleSectionProps {
  /** Section title */
  title: string
  /** Whether the section is initially open (uncontrolled mode) */
  defaultOpen?: boolean
  /** Controlled mode: section is open */
  isOpen?: boolean
  /** Controlled mode: callback when toggle is clicked */
  onToggle?: (isOpen: boolean) => void
  /** Optional settings icon and handler */
  onSettingsClick?: () => void
  /** Section content */
  children: React.ReactNode
}

/**
 * A collapsible section with toggle button and optional settings icon.
 * Supports both controlled (external state) and uncontrolled (internal state) modes.
 */
export function CollapsibleSection({
  title,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle,
  onSettingsClick,
  children
}: Readonly<CollapsibleSectionProps>) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const handleToggle = () => {
    const newValue = !isOpen
    if (isControlled) {
      onToggle?.(newValue)
    } else {
      setInternalIsOpen(newValue)
    }
  }

  return (
    <div>
      <Group justify="space-between" mb="sm">
        <Group
          flex={1}
          onClick={handleToggle}
          style={{cursor: 'pointer'}}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleToggle()
            }
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
        >
          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
            {title}
          </Text>
          {isOpen ? (
            <IconChevronUp aria-hidden="true" size={16} />
          ) : (
            <IconChevronDown aria-hidden="true" size={16} />
          )}
        </Group>
        {onSettingsClick && (
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={onSettingsClick}
            aria-label={`Manage ${title}`}
          >
            <IconSettings size={14} />
          </ActionIcon>
        )}
      </Group>
      <Collapse expanded={isOpen}>{children}</Collapse>
    </div>
  )
}
