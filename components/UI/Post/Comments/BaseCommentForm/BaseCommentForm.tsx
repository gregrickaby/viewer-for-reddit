'use client'

import {Box, Button, Group, Stack, Tabs, Text, Textarea} from '@mantine/core'
import {useState} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './BaseCommentForm.module.css'

/**
 * Props for BaseCommentForm component.
 */
export interface BaseCommentFormProps {
  /** Current comment text value */
  value: string
  /** Handler for text changes */
  onChange: (text: string) => void
  /** Handler for form submission */
  onSubmit: () => void | Promise<void>
  /** Handler for cancel action */
  onCancel: () => void
  /** Error message to display */
  error?: string
  /** Whether submission is in progress */
  isSubmitting?: boolean
  /** Placeholder text for textarea */
  placeholder?: string
  /** Ref for textarea element */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  /** Custom label for submit button */
  submitLabel?: string
  /** Size variant for buttons */
  buttonSize?: 'xs' | 'sm' | 'md'
  /** Minimum rows for textarea */
  minRows?: number
  /** ARIA label for textarea */
  ariaLabel?: string
  /** Umami event name for submit button */
  submitEventName?: string
  /** Umami event name for cancel button */
  cancelEventName?: string
}

/**
 * Base comment form component with Markdown preview.
 *
 * Provides a reusable form for creating/editing comments with:
 * - Tabbed interface (Write/Preview modes)
 * - Markdown preview using react-markdown + remark-gfm
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to submit)
 * - Loading states during submission
 * - Error display
 * - Accessible ARIA labels
 *
 * This component follows the "package test" principle - designed as if it
 * were a standalone npm package with clear props interface and minimal
 * coupling to application-specific logic.
 *
 * @param props - Component props
 * @returns JSX.Element rendered comment form
 */
export function BaseCommentForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  error,
  isSubmitting = false,
  placeholder = 'Write your comment (markdown supported)...',
  textareaRef,
  submitLabel = 'Submit',
  buttonSize = 'sm',
  minRows = 3,
  ariaLabel = 'Comment text. Press Ctrl+Enter or Cmd+Enter to submit.',
  submitEventName,
  cancelEventName
}: Readonly<BaseCommentFormProps>) {
  const [activeTab, setActiveTab] = useState<string | null>('write')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if (
      (e.metaKey || e.ctrlKey) &&
      e.key === 'Enter' &&
      !isSubmitting &&
      value.trim()
    ) {
      e.preventDefault()
      onSubmit()
    }
  }

  const handleSubmitClick = async () => {
    await onSubmit()
  }

  return (
    <Stack gap="xs">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="write">Write</Tabs.Tab>
          <Tabs.Tab value="preview">Preview</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="write" pt="xs">
          <Textarea
            ref={textareaRef}
            aria-label={ariaLabel}
            aria-busy={isSubmitting}
            autosize
            disabled={isSubmitting}
            maxLength={10000}
            minRows={minRows}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            value={value}
          />
        </Tabs.Panel>

        <Tabs.Panel value="preview" pt="xs">
          <Box className={styles.previewContainer}>
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <Text c="dimmed" fs="italic">
                Nothing to preview
              </Text>
            )}
          </Box>
        </Tabs.Panel>
      </Tabs>

      <Group gap="xs">
        <Button
          data-umami-event={submitEventName}
          disabled={!value.trim() || isSubmitting}
          loading={isSubmitting}
          onClick={handleSubmitClick}
          size={buttonSize}
        >
          {submitLabel}
        </Button>
        <Button
          data-umami-event={cancelEventName}
          disabled={isSubmitting}
          onClick={onCancel}
          size={buttonSize}
          variant="subtle"
        >
          Cancel
        </Button>
      </Group>

      {error && (
        <Text c="red" size="sm" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  )
}
