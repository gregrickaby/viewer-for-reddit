import type {ManagedSubscription} from '@/lib/hooks/useSubredditManager'
import {render, screen, user} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {SubscriptionFilterList} from './SubscriptionFilterList'

const subscriptions: ManagedSubscription[] = [
  {name: 'reactjs', displayName: 'r/reactjs'},
  {name: 'aww', displayName: 'r/aww'},
  {name: 'nextjs', displayName: 'r/nextjs'}
]

describe('SubscriptionFilterList', () => {
  it('renders every subscription with an accessible search and sort control', () => {
    render(<SubscriptionFilterList subscriptions={subscriptions} />)

    expect(screen.getByLabelText('Search subscriptions')).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', {name: 'Sort subscriptions'})
    ).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'r/reactjs'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'r/aww'})).toBeInTheDocument()
    expect(screen.getByRole('link', {name: 'r/nextjs'})).toBeInTheDocument()
  })

  it('filters the list as the user types in the search box', async () => {
    render(<SubscriptionFilterList subscriptions={subscriptions} />)

    await user.type(screen.getByLabelText('Search subscriptions'), 'react')

    expect(screen.getByRole('link', {name: 'r/reactjs'})).toBeInTheDocument()
    expect(screen.queryByRole('link', {name: 'r/aww'})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', {name: 'r/nextjs'})
    ).not.toBeInTheDocument()
  })

  it('links each subscription to its subreddit page', () => {
    render(<SubscriptionFilterList subscriptions={subscriptions} />)

    expect(screen.getByRole('link', {name: 'r/aww'})).toHaveAttribute(
      'href',
      '/r/aww'
    )
  })
})
