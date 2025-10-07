import type {NestedCommentData} from '@/lib/utils/formatting/commentFilters'
import {render, screen} from '@/test-utils'
import userEvent from '@testing-library/user-event'
import {
  CommentExpansionProvider,
  useCommentExpansion
} from './CommentExpansionContext'

// Test component to expose context values
function TestComponent() {
  const {
    isCommentExpanded,
    isSubtreeExpanded,
    toggleComment,
    toggleCommentSubtree
  } = useCommentExpansion()

  const mockComment: NestedCommentData = {
    id: 'parent',
    author: 'testuser',
    body: 'Parent comment',
    depth: 0,
    hasReplies: true,
    replies: [
      {
        id: 'child1',
        author: 'childuser1',
        body: 'Child 1',
        depth: 1,
        hasReplies: true,
        replies: [
          {
            id: 'grandchild1',
            author: 'granduser',
            body: 'Grandchild',
            depth: 2,
            hasReplies: false
          }
        ]
      },
      {
        id: 'child2',
        author: 'childuser2',
        body: 'Child 2',
        depth: 1,
        hasReplies: false
      }
    ]
  }

  return (
    <div>
      <div data-testid="parent-expanded">
        {isCommentExpanded('parent').toString()}
      </div>
      <div data-testid="parent-subtree-expanded">
        {isSubtreeExpanded('parent').toString()}
      </div>
      <div data-testid="child1-expanded">
        {isCommentExpanded('child1').toString()}
      </div>
      <div data-testid="child2-expanded">
        {isCommentExpanded('child2').toString()}
      </div>
      <div data-testid="grandchild1-expanded">
        {isCommentExpanded('grandchild1').toString()}
      </div>

      <button
        type="button"
        onClick={() => toggleComment('parent')}
        data-testid="toggle-parent"
      >
        Toggle Parent
      </button>
      <button
        type="button"
        onClick={() => toggleCommentSubtree('parent', mockComment)}
        data-testid="toggle-parent-subtree"
      >
        Toggle Parent Subtree
      </button>
    </div>
  )
}

describe('CommentExpansionContext', () => {
  it('should provide initial state with no expanded comments', () => {
    render(
      <CommentExpansionProvider>
        <TestComponent />
      </CommentExpansionProvider>
    )

    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('parent-subtree-expanded')).toHaveTextContent(
      'false'
    )
    expect(screen.getByTestId('child1-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('child2-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('grandchild1-expanded')).toHaveTextContent(
      'false'
    )
  })

  it('should toggle individual comment expansion', async () => {
    const user = userEvent.setup()
    render(
      <CommentExpansionProvider>
        <TestComponent />
      </CommentExpansionProvider>
    )

    const toggleButton = screen.getByTestId('toggle-parent')

    // Initially not expanded
    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('false')

    // Click to expand
    await user.click(toggleButton)
    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('true')
    expect(screen.getByTestId('parent-subtree-expanded')).toHaveTextContent(
      'false'
    )

    // Children should not be automatically expanded
    expect(screen.getByTestId('child1-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('child2-expanded')).toHaveTextContent('false')

    // Click to collapse
    await user.click(toggleButton)
    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('false')
  })

  it('should expand entire subtree when toggling subtree expansion', async () => {
    const user = userEvent.setup()
    render(
      <CommentExpansionProvider>
        <TestComponent />
      </CommentExpansionProvider>
    )

    const toggleSubtreeButton = screen.getByTestId('toggle-parent-subtree')

    // Initially not expanded
    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('parent-subtree-expanded')).toHaveTextContent(
      'false'
    )

    // Click to expand subtree
    await user.click(toggleSubtreeButton)

    // Parent should be expanded and marked as subtree expanded
    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('true')
    expect(screen.getByTestId('parent-subtree-expanded')).toHaveTextContent(
      'true'
    )

    // All descendants should be expanded
    expect(screen.getByTestId('child1-expanded')).toHaveTextContent('true')
    expect(screen.getByTestId('child2-expanded')).toHaveTextContent('true')
    expect(screen.getByTestId('grandchild1-expanded')).toHaveTextContent('true')

    // Click to collapse subtree
    await user.click(toggleSubtreeButton)

    // All should be collapsed
    expect(screen.getByTestId('parent-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('parent-subtree-expanded')).toHaveTextContent(
      'false'
    )
    expect(screen.getByTestId('child1-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('child2-expanded')).toHaveTextContent('false')
    expect(screen.getByTestId('grandchild1-expanded')).toHaveTextContent(
      'false'
    )
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function ComponentOutsideProvider() {
      useCommentExpansion()
      return null
    }

    expect(() => {
      render(<ComponentOutsideProvider />)
    }).toThrow(
      'useCommentExpansion must be used within a CommentExpansionProvider'
    )

    consoleSpy.mockRestore()
  })

  it('should handle comments without IDs gracefully', async () => {
    function TestComponentWithoutId() {
      const {isCommentExpanded, toggleComment} = useCommentExpansion()

      return (
        <div>
          <div data-testid="empty-id-expanded">
            {isCommentExpanded('').toString()}
          </div>
          <button
            type="button"
            onClick={() => toggleComment('')}
            data-testid="toggle-empty-id"
          >
            Toggle Empty ID
          </button>
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <CommentExpansionProvider>
        <TestComponentWithoutId />
      </CommentExpansionProvider>
    )

    expect(screen.getByTestId('empty-id-expanded')).toHaveTextContent('false')

    // Should handle empty ID gracefully
    await user.click(screen.getByTestId('toggle-empty-id'))
    expect(screen.getByTestId('empty-id-expanded')).toHaveTextContent('true')
  })
})
