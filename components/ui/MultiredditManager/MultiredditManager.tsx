'use client'

import {
  type ManagedMultireddit,
  useMultiredditManager,
  useMultiredditSearch
} from '@/lib/hooks'
import {formatNumber} from '@/lib/utils/formatters'
import {
  Accordion,
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Button,
  Combobox,
  Divider,
  Drawer,
  Group,
  InputBase,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useCombobox
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconEdit,
  IconPlus,
  IconTrash,
  IconX
} from '@tabler/icons-react'
import {useState} from 'react'

interface MultiredditManagerProps {
  /** Whether the drawer is open */
  opened: boolean
  /** Callback to close the drawer */
  onClose: () => void
  /** Initial multireddits list from server */
  multireddits: ManagedMultireddit[]
}

/**
 * Drawer panel for managing user multireddits.
 * Allows creating, renaming, deleting multireddits and adding/removing subreddits.
 *
 * @example
 * ```typescript
 * <MultiredditManager
 *   opened={drawerOpen}
 *   onClose={closeDrawer}
 *   multireddits={multireddits}
 * />
 * ```
 */
export function MultiredditManager({
  opened,
  onClose,
  multireddits: initialMultireddits
}: Readonly<MultiredditManagerProps>) {
  const {
    multireddits,
    error,
    isPending,
    clearError,
    create,
    remove,
    rename,
    addSubreddit,
    removeSubreddit
  } = useMultiredditManager({initialMultireddits})

  const [newName, setNewName] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')

  const handleCreate = () => {
    const trimmedName = newName.trim()
    const trimmedDisplay = newDisplayName.trim()
    if (!trimmedName || !trimmedDisplay || isPending) return
    create(trimmedName, trimmedDisplay)
    setNewName('')
    setNewDisplayName('')
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="md">
          Manage Multireddits
        </Text>
      }
      position="right"
      size="sm"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            <Group
              justify="space-between"
              align="center"
              gap="xs"
              wrap="nowrap"
            >
              <Text size="sm" flex={1}>
                {error}
              </Text>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="red"
                onClick={clearError}
                data-testid="dismiss-error-btn"
                aria-label="Dismiss error"
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Alert>
        )}

        {/* Create section */}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Create New Multireddit
          </Text>
          <TextInput
            label="URL Name"
            description="Letters, numbers, underscores — min 3 chars"
            placeholder="my_multi"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            size="sm"
          />
          <TextInput
            label="Display Name"
            placeholder="My Tech Feed"
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            size="sm"
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
            disabled={isPending || !newName.trim() || !newDisplayName.trim()}
            loading={isPending}
            size="sm"
          >
            Create
          </Button>
        </Stack>

        {multireddits.length > 0 && (
          <>
            <Divider />
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Your Multireddits ({multireddits.length})
            </Text>
            <Accordion variant="separated" chevronPosition="left">
              {multireddits.map((multi) => (
                <MultiItem
                  key={multi.path}
                  multi={multi}
                  isPending={isPending}
                  onRename={(name) => rename(multi.path, name)}
                  onDelete={() => remove(multi.path)}
                  onAddSubreddit={(sub) => addSubreddit(multi.path, sub)}
                  onRemoveSubreddit={(sub) => removeSubreddit(multi.path, sub)}
                />
              ))}
            </Accordion>
          </>
        )}

        {multireddits.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No multireddits yet. Create one above!
          </Text>
        )}
      </Stack>
    </Drawer>
  )
}

// ─── MultiItem sub-component ────────────────────────────────────────────────

interface MultiItemProps {
  multi: ManagedMultireddit
  isPending: boolean
  onRename: (name: string) => void
  onDelete: () => void
  onAddSubreddit: (sub: string) => void
  onRemoveSubreddit: (sub: string) => void
}

function MultiItem({
  multi,
  isPending,
  onRename,
  onDelete,
  onAddSubreddit,
  onRemoveSubreddit
}: Readonly<MultiItemProps>) {
  const [editingName, setEditingName] = useState(false)
  const [editedName, setEditedName] = useState(multi.displayName)

  const {query, setQuery, results, isLoading, clearResults} =
    useMultiredditSearch()

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const handleRenameSubmit = () => {
    const trimmed = editedName.trim()
    if (!trimmed) {
      setEditedName(multi.displayName)
      setEditingName(false)
      return
    }
    if (trimmed !== multi.displayName) {
      onRename(trimmed)
    }
    setEditingName(false)
  }

  const handleRenameCancel = () => {
    setEditedName(multi.displayName)
    setEditingName(false)
  }

  const handleAddSubreddit = (value: string) => {
    const sub = value.trim().replace(/^[ru]\//, '')
    if (!sub) return
    onAddSubreddit(sub)
    clearResults()
    combobox.closeDropdown()
  }

  const showDropdown = results.length > 0 || isLoading

  return (
    <Accordion.Item value={multi.path}>
      <Accordion.Control>
        <Group justify="space-between" pr="xs">
          <Text size="sm" fw={500} flex={1} lineClamp={1}>
            {multi.displayName}
          </Text>
          <Badge size="xs" variant="light" color="blue">
            {multi.subreddits.length}
          </Badge>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Stack gap="sm">
          {/* Rename row */}
          {editingName ? (
            <Group gap="xs">
              <TextInput
                value={editedName}
                onChange={(e) => setEditedName(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') handleRenameCancel()
                }}
                size="xs"
                flex={1}
                autoFocus
                aria-label="New display name"
              />
              <ActionIcon
                size="sm"
                color="green"
                onClick={handleRenameSubmit}
                disabled={isPending}
                aria-label="Save name"
              >
                <IconCheck size={14} />
              </ActionIcon>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={handleRenameCancel}
                aria-label="Cancel rename"
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          ) : (
            <Group justify="flex-end" gap="xs">
              <Tooltip label="Rename" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => {
                    setEditedName(multi.displayName)
                    setEditingName(true)
                  }}
                  aria-label={`Rename ${multi.displayName}`}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Delete multireddit" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={onDelete}
                  disabled={isPending}
                  aria-label={`Delete ${multi.displayName}`}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}

          {/* Subreddits list */}
          <Stack gap={4}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Subreddits
            </Text>
            {multi.subreddits.length === 0 ? (
              <Text size="xs" c="dimmed">
                None added yet.
              </Text>
            ) : (
              multi.subreddits.map((sub) => (
                <Group key={sub} justify="space-between" gap="xs">
                  <Text size="xs">r/{sub}</Text>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => onRemoveSubreddit(sub)}
                    disabled={isPending}
                    aria-label={`Remove r/${sub} from multireddit`}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Group>
              ))
            )}
          </Stack>

          {/* Add subreddit with autocomplete */}
          <Combobox
            onOptionSubmit={handleAddSubreddit}
            store={combobox}
            withinPortal
          >
            <Combobox.Target>
              <Group gap="xs">
                <InputBase
                  placeholder="subreddit or user..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.currentTarget.value)
                    combobox.openDropdown()
                  }}
                  onBlur={() => combobox.closeDropdown()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      e.preventDefault()
                      handleAddSubreddit(query)
                    }
                  }}
                  rightSection={isLoading ? <Loader size={14} /> : null}
                  size="xs"
                  flex={1}
                  aria-label="Add subreddit to multireddit"
                />
                <Tooltip label="Add subreddit" withArrow>
                  <ActionIcon
                    size="sm"
                    disabled={isPending || !query.trim()}
                    onClick={() => handleAddSubreddit(query)}
                    aria-label="Add subreddit"
                  >
                    <IconPlus size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Combobox.Target>

            <Combobox.Dropdown hidden={!showDropdown}>
              <Combobox.Options>
                {isLoading && (
                  <Combobox.Empty>
                    <Group justify="center" p="xs">
                      <Loader size="sm" />
                    </Group>
                  </Combobox.Empty>
                )}
                {!isLoading &&
                  results.map((item) => (
                    <Combobox.Option value={item.displayName} key={item.name}>
                      <Group wrap="nowrap" gap="sm">
                        <Avatar
                          src={item.icon}
                          size={20}
                          radius="sm"
                          alt={item.displayName}
                        />
                        <Stack gap={0}>
                          <Text size="xs" fw={500}>
                            {item.displayName}
                          </Text>
                          {item.subscribers != null && item.subscribers > 0 && (
                            <Text size="xs" c="dimmed">
                              {formatNumber(item.subscribers)}{' '}
                              {item.type === 'user' ? 'followers' : 'members'}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Combobox.Option>
                  ))}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  )
}
