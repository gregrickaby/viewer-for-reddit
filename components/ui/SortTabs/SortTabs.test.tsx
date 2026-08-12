import {render, screen, user} from '@/test-utils'
import {axe} from 'jest-axe'
import {describe, expect, it, vi} from 'vitest'
import {SortTabs} from './SortTabs'

const tabs = [
  {value: 'hot', label: 'Hot'},
  {value: 'new', label: 'New'}
]

describe('SortTabs', () => {
  it('shows the active tab label on the trigger button', () => {
    render(<SortTabs value="new" onChange={vi.fn()} tabs={tabs} />)

    expect(screen.getByRole('button', {name: /new/i})).toBeInTheDocument()
  })

  it('lists every tab as a menu item when opened', async () => {
    render(<SortTabs value="hot" onChange={vi.fn()} tabs={tabs} />)

    await user.click(screen.getByRole('button', {name: /hot/i}))

    expect(await screen.findByText('New')).toBeInTheDocument()
  })

  it('calls onChange with the clicked option value', async () => {
    const onChange = vi.fn()
    render(<SortTabs value="hot" onChange={onChange} tabs={tabs} />)

    await user.click(screen.getByRole('button', {name: /hot/i}))
    await user.click(await screen.findByText('New'))

    expect(onChange).toHaveBeenCalledWith('new')
  })

  it('does not call onChange when picking the already-active option', async () => {
    const onChange = vi.fn()
    render(<SortTabs value="hot" onChange={onChange} tabs={tabs} />)

    await user.click(screen.getByRole('button', {name: /hot/i}))
    await user.click((await screen.findAllByText('Hot'))[1])

    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables the trigger button when disabled is true', () => {
    render(<SortTabs value="hot" onChange={vi.fn()} disabled tabs={tabs} />)

    expect(screen.getByRole('button', {name: /hot/i})).toBeDisabled()
  })

  it('renders a leftSection icon on each dropdown item', async () => {
    render(
      <SortTabs
        value="hot"
        onChange={vi.fn()}
        tabs={[{value: 'hot', label: 'Hot', icon: <svg data-testid="icon" />}]}
      />
    )

    await user.click(screen.getByRole('button', {name: /hot/i}))

    expect(await screen.findByTestId('icon')).toBeInTheDocument()
  })

  it('uses "Sort by" as the default trigger aria-label', () => {
    render(<SortTabs value="hot" onChange={vi.fn()} tabs={tabs} />)

    expect(
      screen.getByRole('button', {name: /sort by.*hot/i})
    ).toBeInTheDocument()
  })

  it('applies a custom ariaLabel to the trigger button', () => {
    render(
      <SortTabs
        value="hot"
        onChange={vi.fn()}
        tabs={tabs}
        ariaLabel="Filter by time"
      />
    )

    expect(
      screen.getByRole('button', {name: /filter by time.*hot/i})
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const {container} = render(
      <SortTabs value="hot" onChange={vi.fn()} tabs={tabs} />
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
