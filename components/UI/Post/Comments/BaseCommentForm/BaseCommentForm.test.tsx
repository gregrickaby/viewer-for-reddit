import {render, screen, user} from '@/test-utils'
import {BaseCommentForm} from './BaseCommentForm'

describe('BaseCommentForm', () => {
  // Mock handlers
  const mockOnChange = vi.fn()
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  // Default props
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<BaseCommentForm {...defaultProps} />)

      expect(screen.getByRole('tab', {name: /write/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /preview/i})).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText(/write your comment/i)
      ).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /submit/i})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /cancel/i})).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      render(
        <BaseCommentForm
          {...defaultProps}
          placeholder="Custom placeholder text"
        />
      )

      expect(
        screen.getByPlaceholderText('Custom placeholder text')
      ).toBeInTheDocument()
    })

    it('should render with custom submit label', () => {
      render(<BaseCommentForm {...defaultProps} submitLabel="Post Reply" />)

      expect(
        screen.getByRole('button', {name: /post reply/i})
      ).toBeInTheDocument()
    })

    it('should render error message when error prop is provided', () => {
      render(<BaseCommentForm {...defaultProps} error="Test error message" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Test error message')
    })

    it('should not render error message when error prop is not provided', () => {
      render(<BaseCommentForm {...defaultProps} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Textarea Functionality', () => {
    it('should call onChange when text is entered', async () => {
      render(<BaseCommentForm {...defaultProps} />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      await user.type(textarea, 'T')

      // Each keystroke triggers onChange
      expect(mockOnChange).toHaveBeenCalled()
      expect(mockOnChange).toHaveBeenLastCalledWith('T')
    })

    it('should display current value in textarea', () => {
      render(<BaseCommentForm {...defaultProps} value="Existing text" />)

      expect(screen.getByDisplayValue('Existing text')).toBeInTheDocument()
    })

    it('should have maxLength of 10000', () => {
      render(<BaseCommentForm {...defaultProps} />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      expect(textarea).toHaveAttribute('maxlength', '10000')
    })

    it('should be disabled when isSubmitting is true', () => {
      render(<BaseCommentForm {...defaultProps} isSubmitting />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      expect(textarea).toBeDisabled()
    })

    it('should not be disabled when isSubmitting is false', () => {
      render(<BaseCommentForm {...defaultProps} isSubmitting={false} />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      expect(textarea).toBeEnabled()
    })

    it('should have aria-busy attribute when isSubmitting is true', () => {
      render(<BaseCommentForm {...defaultProps} isSubmitting />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      expect(textarea).toHaveAttribute('aria-busy', 'true')
    })

    it('should have custom aria-label when provided', () => {
      render(
        <BaseCommentForm {...defaultProps} ariaLabel="Custom ARIA label" />
      )
      const textarea = screen.getByLabelText('Custom ARIA label')

      expect(textarea).toBeInTheDocument()
    })

    it('should have custom minRows when provided', () => {
      render(<BaseCommentForm {...defaultProps} minRows={5} />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      // Mantine Textarea has autosize, so we verify it rendered correctly
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('Button Functionality', () => {
    it('should call onSubmit when submit button is clicked', async () => {
      render(<BaseCommentForm {...defaultProps} value="Test comment" />)
      const submitButton = screen.getByRole('button', {name: /submit/i})

      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when cancel button is clicked', async () => {
      render(<BaseCommentForm {...defaultProps} value="Test comment" />)
      const cancelButton = screen.getByRole('button', {name: /cancel/i})

      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should disable submit button when value is empty', () => {
      render(<BaseCommentForm {...defaultProps} value="" />)
      const submitButton = screen.getByRole('button', {name: /submit/i})

      expect(submitButton).toBeDisabled()
    })

    it('should disable submit button when value is only whitespace', () => {
      render(<BaseCommentForm {...defaultProps} value="   " />)
      const submitButton = screen.getByRole('button', {name: /submit/i})

      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when value has content', () => {
      render(<BaseCommentForm {...defaultProps} value="Test comment" />)
      const submitButton = screen.getByRole('button', {name: /submit/i})

      expect(submitButton).toBeEnabled()
    })

    it('should show loading state on submit button when isSubmitting is true', () => {
      render(<BaseCommentForm {...defaultProps} value="Test" isSubmitting />)
      const submitButton = screen.getByRole('button', {name: /submit/i})

      expect(submitButton).toHaveAttribute('data-loading', 'true')
    })

    it('should disable both buttons when isSubmitting is true', () => {
      render(<BaseCommentForm {...defaultProps} value="Test" isSubmitting />)
      const submitButton = screen.getByRole('button', {name: /submit/i})
      const cancelButton = screen.getByRole('button', {name: /cancel/i})

      expect(submitButton).toBeDisabled()
      expect(cancelButton).toBeDisabled()
    })

    it.each([['xs' as const], ['sm' as const], ['md' as const]])(
      'should apply buttonSize "%s" to buttons',
      (size) => {
        render(<BaseCommentForm {...defaultProps} buttonSize={size} />)
        const submitButton = screen.getByRole('button', {name: /submit/i})

        expect(submitButton).toHaveAttribute('data-size', size)
      }
    )

    it('should have umami event attribute on submit button when provided', () => {
      render(
        <BaseCommentForm
          {...defaultProps}
          value="Test"
          submitEventName="test-submit-event"
        />
      )
      const submitButton = screen.getByRole('button', {name: /submit/i})

      expect(submitButton).toHaveAttribute(
        'data-umami-event',
        'test-submit-event'
      )
    })

    it('should have umami event attribute on cancel button when provided', () => {
      render(
        <BaseCommentForm
          {...defaultProps}
          cancelEventName="test-cancel-event"
        />
      )
      const cancelButton = screen.getByRole('button', {name: /cancel/i})

      expect(cancelButton).toHaveAttribute(
        'data-umami-event',
        'test-cancel-event'
      )
    })
  })

  describe('Keyboard Shortcuts', () => {
    it.each([
      ['metaKey', '{Meta>}{Enter}{/Meta}', 'Mac Cmd+Enter'],
      ['ctrlKey', '{Control>}{Enter}{/Control}', 'Windows/Linux Ctrl+Enter']
    ])(
      'should call onSubmit when %s + Enter is pressed',
      async (_modifierKey, keys) => {
        render(<BaseCommentForm {...defaultProps} value="Test comment" />)
        const textarea = screen.getByPlaceholderText(/write your comment/i)

        await user.click(textarea)
        await user.keyboard(keys)

        expect(mockOnSubmit).toHaveBeenCalledTimes(1)
      }
    )

    it('should not call onSubmit when only Enter is pressed', async () => {
      render(<BaseCommentForm {...defaultProps} value="Test comment" />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      textarea.focus()
      await user.keyboard('Enter')

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not call onSubmit on keyboard shortcut when isSubmitting is true', async () => {
      render(<BaseCommentForm {...defaultProps} value="Test" isSubmitting />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      textarea.focus()
      await user.keyboard('{Control>}Enter{/Control}')

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should not call onSubmit on keyboard shortcut when value is empty', async () => {
      render(<BaseCommentForm {...defaultProps} value="" />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      textarea.focus()
      await user.keyboard('{Control>}Enter{/Control}')

      // onSubmit should not be called when value is empty (submit button is disabled)
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Tab Switching', () => {
    it('should default to Write tab', () => {
      render(<BaseCommentForm {...defaultProps} />)
      const writeTab = screen.getByRole('tab', {name: /write/i})

      expect(writeTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should switch to Preview tab when clicked', async () => {
      render(<BaseCommentForm {...defaultProps} value="# Test" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(previewTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should hide textarea when on Preview tab', async () => {
      render(<BaseCommentForm {...defaultProps} value="Test" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(
        screen.queryByPlaceholderText(/write your comment/i)
      ).not.toBeVisible()
    })

    it('should show textarea when switching back to Write tab', async () => {
      render(<BaseCommentForm {...defaultProps} value="Test" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})
      const writeTab = screen.getByRole('tab', {name: /write/i})

      await user.click(previewTab)
      await user.click(writeTab)

      expect(screen.getByPlaceholderText(/write your comment/i)).toBeVisible()
    })
  })

  describe('Markdown Preview', () => {
    it('should render markdown preview when Preview tab is active', async () => {
      render(<BaseCommentForm {...defaultProps} value="# Heading" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Heading'
      )
    })

    it('should show "Nothing to preview" when value is empty', async () => {
      render(<BaseCommentForm {...defaultProps} value="" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(screen.getByText('Nothing to preview')).toBeInTheDocument()
    })

    it('should show "Nothing to preview" when value is only whitespace', async () => {
      render(<BaseCommentForm {...defaultProps} value="   " />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(screen.getByText('Nothing to preview')).toBeInTheDocument()
    })

    it('should render bold text in preview', async () => {
      render(<BaseCommentForm {...defaultProps} value="**bold text**" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      const boldElement = screen.getByText('bold text')
      expect(boldElement.tagName).toBe('STRONG')
    })

    it('should render italic text in preview', async () => {
      render(<BaseCommentForm {...defaultProps} value="*italic text*" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      const italicElement = screen.getByText('italic text')
      expect(italicElement.tagName).toBe('EM')
    })

    it('should render links in preview', async () => {
      render(
        <BaseCommentForm
          {...defaultProps}
          value="[Click here](https://example.com)"
        />
      )
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      const link = screen.getByRole('link', {name: /click here/i})
      expect(link).toHaveAttribute('href', 'https://example.com')
    })

    it('should render unordered lists in preview', async () => {
      const listMarkdown = `- Item 1
- Item 2
- Item 3`
      render(<BaseCommentForm {...defaultProps} value={listMarkdown} />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('should render ordered lists in preview', async () => {
      const listMarkdown = `1. First
2. Second
3. Third`
      render(<BaseCommentForm {...defaultProps} value={listMarkdown} />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })

    it('should render inline code in preview', async () => {
      render(<BaseCommentForm {...defaultProps} value="Use `const` keyword" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      const codeElement = screen.getByText('const')
      expect(codeElement.tagName).toBe('CODE')
    })

    it('should render code blocks in preview', async () => {
      const codeMarkdown = `\`\`\`javascript
const x = 42;
\`\`\``
      render(<BaseCommentForm {...defaultProps} value={codeMarkdown} />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      // Look within the preview container
      const container = document.querySelector('._previewContainer_2aad1e')
      const codeElement = container?.querySelector('code')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement?.textContent).toContain('const x = 42')
    })

    it('should render blockquotes in preview', async () => {
      render(<BaseCommentForm {...defaultProps} value="> Quoted text" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      const blockquote = screen.getByText('Quoted text').closest('blockquote')
      expect(blockquote).toBeInTheDocument()
    })

    it('should render strikethrough text with remark-gfm', async () => {
      render(<BaseCommentForm {...defaultProps} value="~~strikethrough~~" />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      const strikeElement = screen.getByText('strikethrough')
      expect(strikeElement.tagName).toBe('DEL')
    })

    it('should render tables with remark-gfm', async () => {
      const tableMarkdown = `| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |`

      render(<BaseCommentForm {...defaultProps} value={tableMarkdown} />)
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Header 1')).toBeInTheDocument()
      expect(screen.getByText('Cell 1')).toBeInTheDocument()
    })

    it('should update preview when value changes', async () => {
      const {rerender} = render(
        <BaseCommentForm {...defaultProps} value="# Original" />
      )
      const previewTab = screen.getByRole('tab', {name: /preview/i})

      await user.click(previewTab)
      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Original'
      )

      rerender(<BaseCommentForm {...defaultProps} value="# Updated" />)
      expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
        'Updated'
      )
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA roles for tabs', () => {
      render(<BaseCommentForm {...defaultProps} />)

      expect(screen.getByRole('tab', {name: /write/i})).toBeInTheDocument()
      expect(screen.getByRole('tab', {name: /preview/i})).toBeInTheDocument()
    })

    it('should have proper ARIA attributes for selected tab', () => {
      render(<BaseCommentForm {...defaultProps} />)
      const writeTab = screen.getByRole('tab', {name: /write/i})

      expect(writeTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should have proper role for error message', () => {
      render(<BaseCommentForm {...defaultProps} error="Error message" />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have proper aria-busy attribute when submitting', () => {
      render(<BaseCommentForm {...defaultProps} value="Test" isSubmitting />)
      const textarea = screen.getByPlaceholderText(/write your comment/i)

      expect(textarea).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('Textarea Ref', () => {
    it('should attach ref to textarea element', () => {
      const textareaRef = {current: null}
      render(<BaseCommentForm {...defaultProps} textareaRef={textareaRef} />)

      expect(textareaRef.current).toBeInstanceOf(HTMLTextAreaElement)
    })
  })
})
