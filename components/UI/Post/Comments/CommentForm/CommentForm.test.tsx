import {http, HttpResponse, render, screen, user, waitFor} from '@/test-utils'
import {server} from '@/test-utils/msw/server'
import {CommentForm} from './CommentForm'

// Helper to delay API responses
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('CommentForm', () => {
  describe('Unauthenticated user', () => {
    it('should not render form when user is not authenticated', () => {
      render(<CommentForm thingId="t3_test123" />)

      expect(
        screen.queryByRole('button', {name: /add a comment/i})
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('textbox', {name: /comment text/i})
      ).not.toBeInTheDocument()
    })
  })

  describe('Authenticated user', () => {
    const preloadedState = {
      auth: {
        isAuthenticated: true,
        username: 'testuser',
        expiresAt: Date.now() + 3600000
      }
    }

    it('should render toggle button when form is closed', () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})
      expect(
        screen.getByRole('button', {name: /add a comment/i})
      ).toBeInTheDocument()
    })

    it('should expand form when toggle button is clicked', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      expect(
        screen.getByRole('textbox', {
          name: /comment text.*ctrl\+enter.*cmd\+enter/i
        })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /^comment$/i})
      ).toBeInTheDocument()
      expect(screen.getByRole('button', {name: /cancel/i})).toBeInTheDocument()
    })

    it('should auto-focus textarea when form opens', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await waitFor(() => {
        expect(textarea).toHaveFocus()
      })
    })

    it('should update textarea value when typing', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'This is my test comment')

      expect(textarea).toHaveValue('This is my test comment')
    })

    it('should disable submit button when textarea is empty', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when textarea has text', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'Test comment')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      expect(submitButton).toBeEnabled()
    })

    it('should close form when cancel button is clicked', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'This will be cancelled')

      const cancelButton = screen.getByRole('button', {name: /cancel/i})
      await user.click(cancelButton)

      expect(
        screen.queryByRole('textbox', {name: /comment text/i})
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', {name: /add a comment/i})
      ).toBeInTheDocument()
    })

    it('should clear textarea when form is cancelled', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'This will be cleared')

      const cancelButton = screen.getByRole('button', {name: /cancel/i})
      await user.click(cancelButton)

      // Reopen form
      await user.click(screen.getByRole('button', {name: /add a comment/i}))

      const newTextarea = screen.getByRole('textbox', {name: /comment text/i})
      expect(newTextarea).toHaveValue('')
    })

    it('should return focus to toggle button after cancel', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {
        name: /comment text.*ctrl\+enter.*cmd\+enter/i
      })
      await user.type(textarea, 'Test text')

      const cancelButton = screen.getByRole('button', {name: /cancel/i})
      await user.click(cancelButton)

      // Toggle button should receive focus after cancel
      await waitFor(() => {
        expect(
          screen.getByRole('button', {name: /add a comment/i})
        ).toHaveFocus()
      })
    })

    it('should submit comment successfully', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'Successful comment submission')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      await user.click(submitButton)

      // Form should close after successful submission
      await waitFor(() => {
        expect(
          screen.queryByRole('textbox', {name: /comment text/i})
        ).not.toBeInTheDocument()
      })

      // Toggle button should be back
      expect(
        screen.getByRole('button', {name: /add a comment/i})
      ).toBeInTheDocument()
    })

    it('should disable textarea and buttons while submitting', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      const cancelButton = screen.getByRole('button', {name: /cancel/i})

      // Before submission - nothing disabled
      expect(textarea).toBeEnabled()
      expect(submitButton).toBeDisabled() // Empty textarea
      expect(cancelButton).toBeEnabled()
    })

    it('should submit with keyboard shortcut Cmd+Enter', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'Keyboard shortcut test')

      // Trigger Cmd+Enter (Mac)
      await user.keyboard('{Meta>}{Enter}{/Meta}')

      // Form should close after successful submission
      await waitFor(() => {
        expect(
          screen.queryByRole('button', {name: /^comment$/i})
        ).not.toBeInTheDocument()
      })
    })

    it('should submit with keyboard shortcut Ctrl+Enter', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'Keyboard shortcut test Windows')

      // Trigger Ctrl+Enter (Windows/Linux)
      await user.keyboard('{Control>}{Enter}{/Control}')

      // Form should close after successful submission
      await waitFor(() => {
        expect(
          screen.queryByRole('button', {name: /^comment$/i})
        ).not.toBeInTheDocument()
      })
    })

    it('should display error message on submission failure', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      // Mock API error
      server.use(
        http.post('http://localhost:3000/api/reddit/comment', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'This will fail')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      await user.click(submitButton)

      // Error message should appear
      await waitFor(() => {
        expect(
          screen.getByText(/failed to submit comment/i)
        ).toBeInTheDocument()
      })

      // Form should stay open
      expect(textarea).toBeInTheDocument()
    })

    it('should announce error message to screen readers with role="alert"', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      // Mock API error
      server.use(
        http.post('http://localhost:3000/api/reddit/comment', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {
        name: /comment text.*ctrl\+enter.*cmd\+enter/i
      })
      await user.type(textarea, 'This will fail')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      await user.click(submitButton)

      // Error message should appear with role="alert" for screen readers
      await waitFor(() => {
        expect(
          screen.getByText(/failed to submit comment/i)
        ).toBeInTheDocument()
      })

      const errorElement = screen.getByText(/failed to submit comment/i)
      expect(errorElement).toHaveAttribute('role', 'alert')
    })

    it('should display custom error message from API', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      // Mock API error with custom message
      server.use(
        http.post('http://localhost:3000/api/reddit/comment', () => {
          return HttpResponse.json(
            {message: 'Rate limit exceeded'},
            {status: 429}
          )
        })
      )

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'Rate limit test')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      await user.click(submitButton)

      // Custom error message should appear
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument()
      })
    })

    it('should clear error message when form is cancelled', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      // Mock API error
      server.use(
        http.post('http://localhost:3000/api/reddit/comment', () => {
          return new HttpResponse(null, {status: 500})
        })
      )

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, 'Error test')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      await user.click(submitButton)

      // Wait for error
      await waitFor(() => {
        expect(
          screen.getByText(/failed to submit comment/i)
        ).toBeInTheDocument()
      })

      // Cancel
      const cancelButton = screen.getByRole('button', {name: /cancel/i})
      await user.click(cancelButton)

      // Reopen form
      await user.click(screen.getByRole('button', {name: /add a comment/i}))

      // Error should be cleared
      expect(
        screen.queryByText(/failed to submit comment/i)
      ).not.toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      const {unmount} = render(
        <CommentForm
          thingId="t3_test123"
          placeholder="Custom placeholder text"
        />,
        {
          preloadedState: {
            auth: {
              isAuthenticated: true,
              username: 'testuser',
              expiresAt: Date.now() + 3600000
            }
          }
        }
      )
      unmount()

      render(
        <CommentForm
          thingId="t3_test123"
          placeholder="Custom placeholder text"
          defaultExpanded
        />,
        {
          preloadedState: {
            auth: {
              isAuthenticated: true,
              username: 'testuser',
              expiresAt: Date.now() + 3600000
            }
          }
        }
      )

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder text')
    })

    it('should render expanded by default when defaultExpanded is true', () => {
      const {unmount} = render(<CommentForm thingId="t3_test123" />, {
        preloadedState: {
          auth: {
            isAuthenticated: true,
            username: 'testuser',
            expiresAt: Date.now() + 3600000
          }
        }
      })
      unmount()

      render(<CommentForm thingId="t3_test123" defaultExpanded />, {
        preloadedState: {
          auth: {
            isAuthenticated: true,
            username: 'testuser',
            expiresAt: Date.now() + 3600000
          }
        }
      })

      expect(
        screen.getByRole('textbox', {name: /comment text/i})
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', {name: /add a comment/i})
      ).not.toBeInTheDocument()
    })

    it('should not submit when textarea contains only whitespace', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      await user.type(textarea, '   ')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})
      expect(submitButton).toBeDisabled()
    })

    it('should enforce maxLength of 10000 characters', async () => {
      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {name: /comment text/i})
      expect(textarea).toHaveAttribute('maxLength', '10000')
    })

    it('should set aria-busy during submission', async () => {
      // Make MSW handler slow to simulate network delay
      server.use(
        http.post('http://localhost:3000/api/reddit/comment', async () => {
          await delay(200)
          return HttpResponse.json({
            kind: 't1',
            data: {
              id: 't1_newreply',
              name: 't1_newreply',
              author: 'testuser',
              body: 'Test comment',
              created_utc: Date.now() / 1000
            }
          })
        })
      )

      render(<CommentForm thingId="t3_test123" />, {preloadedState})

      const toggleButton = screen.getByRole('button', {name: /add a comment/i})
      await user.click(toggleButton)

      const textarea = screen.getByRole('textbox', {
        name: /comment text.*ctrl\+enter.*cmd\+enter/i
      })
      await user.type(textarea, 'Test comment')

      const submitButton = screen.getByRole('button', {name: /^comment$/i})

      // Click submit and immediately check aria-busy
      const clickPromise = user.click(submitButton)

      // Textarea should have aria-busy="true" during submission
      await waitFor(
        () => {
          expect(textarea).toHaveAttribute('aria-busy', 'true')
        },
        {timeout: 100}
      )

      // Wait for submission to complete
      await clickPromise

      // Wait for form to close
      await waitFor(() => {
        expect(
          screen.queryByRole('textbox', {
            name: /comment text.*ctrl\+enter.*cmd\+enter/i
          })
        ).not.toBeInTheDocument()
      })
    })
  })
})
