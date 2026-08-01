import {render, screen, user} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {SortTabs} from './SortTabs'

const tabs = [
  {value: 'hot', label: 'Hot'},
  {value: 'new', label: 'New'}
]

describe('SortTabs', () => {
  it('renders a tab for each option', () => {
    render(<SortTabs value="hot" onChange={vi.fn()} tabs={tabs} />)

    expect(screen.getByRole('tab', {name: 'Hot'})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: 'New'})).toBeInTheDocument()
  })

  it('marks the active tab', () => {
    render(<SortTabs value="new" onChange={vi.fn()} tabs={tabs} />)

    expect(screen.getByRole('tab', {name: 'New'})).toHaveAttribute(
      'data-active',
      'true'
    )
  })

  it('calls onChange with the clicked tab value', async () => {
    const onChange = vi.fn()
    render(<SortTabs value="hot" onChange={onChange} tabs={tabs} />)

    await user.click(screen.getByRole('tab', {name: 'New'}))

    expect(onChange).toHaveBeenCalledWith('new')
  })

  it('does not call onChange when clicking the already-active tab', async () => {
    const onChange = vi.fn()
    render(<SortTabs value="hot" onChange={onChange} tabs={tabs} />)

    await user.click(screen.getByRole('tab', {name: 'Hot'}))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables every tab when disabled is true', () => {
    render(<SortTabs value="hot" onChange={vi.fn()} disabled tabs={tabs} />)

    expect(screen.getByRole('tab', {name: 'Hot'})).toBeDisabled()
    expect(screen.getByRole('tab', {name: 'New'})).toBeDisabled()
  })

  it('renders a leftSection icon when provided', () => {
    render(
      <SortTabs
        value="hot"
        onChange={vi.fn()}
        tabs={[{value: 'hot', label: 'Hot', icon: <svg data-testid="icon" />}]}
      />
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
