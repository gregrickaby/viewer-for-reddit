import {render} from '@/test-utils'
import {describe, expect, it, vi} from 'vitest'
import {PostPageTracker} from './PostPageTracker'

const mockSetCurrentPostId = vi.fn()

vi.mock('@/lib/contexts/PostNavigationContext', () => ({
  usePostNavigation: () => ({
    setCurrentPostId: mockSetCurrentPostId,
    setPosts: vi.fn(),
    getNextPost: vi.fn(),
    getPreviousPost: vi.fn(),
    posts: [],
    currentPostId: null
  })
}))

describe('PostPageTracker', () => {
  it('renders without visual output', () => {
    render(<PostPageTracker postId="t3_test123" />)
    // Component returns null, no visible elements rendered
    expect(mockSetCurrentPostId).toHaveBeenCalled()
  })

  it('sets current post ID on mount', () => {
    render(<PostPageTracker postId="t3_test123" />)

    expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_test123')
  })

  it('clears current post ID on unmount', () => {
    const {unmount} = render(<PostPageTracker postId="t3_test123" />)

    unmount()

    expect(mockSetCurrentPostId).toHaveBeenCalledWith(null)
  })

  it('updates post ID when prop changes', () => {
    const {rerender} = render(<PostPageTracker postId="t3_first" />)

    expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_first')

    rerender(<PostPageTracker postId="t3_second" />)

    expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_second')
  })

  it('handles different post ID formats', () => {
    const {rerender} = render(<PostPageTracker postId="t3_abc123" />)
    expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_abc123')

    rerender(<PostPageTracker postId="t3_xyz789" />)
    expect(mockSetCurrentPostId).toHaveBeenCalledWith('t3_xyz789')
  })
})
