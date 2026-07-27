import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {SidebarPanelSkeleton} from './SidebarPanelSkeleton'

describe('SidebarPanelSkeleton', () => {
  it('renders an aside landmark', () => {
    render(<SidebarPanelSkeleton />)

    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })
})
