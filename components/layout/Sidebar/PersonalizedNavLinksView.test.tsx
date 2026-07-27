import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {PersonalizedNavLinksView} from './PersonalizedNavLinksView'

describe('PersonalizedNavLinksView', () => {
  it('renders Popular, All, and Saved links for the given username', () => {
    render(<PersonalizedNavLinksView username="testuser" />)

    const popular = screen.getByRole('link', {name: /popular/i})
    expect(popular).toHaveAttribute('href', '/r/popular')

    const all = screen.getByRole('link', {name: /^all$/i})
    expect(all).toHaveAttribute('href', '/r/all')

    const saved = screen.getByRole('link', {name: /saved/i})
    expect(saved).toHaveAttribute('href', '/user/testuser/saved')
  })
})
