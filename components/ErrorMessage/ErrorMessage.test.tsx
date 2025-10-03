import {ErrorMessage} from '@/components/ErrorMessage/ErrorMessage'
import {render, screen} from '@/test-utils'

describe('ErrorMessage', () => {
  describe('Compact mode', () => {
    it('should render 404 error for user', () => {
      render(
        <ErrorMessage
          error={{status: 404}}
          type="user"
          resourceName="testuser"
          compact
        />
      )

      expect(screen.getByText(/Profile Not Available/)).toBeInTheDocument()
      expect(screen.getByText(/User u\/testuser not found/)).toBeInTheDocument()
    })

    it('should render 403 error for subreddit', () => {
      render(
        <ErrorMessage
          error={{status: 403}}
          type="subreddit"
          resourceName="private"
          compact
        />
      )

      expect(screen.getByText(/Subreddit Not Available/)).toBeInTheDocument()
      expect(
        screen.getByText(/Subreddit r\/private is private or restricted/)
      ).toBeInTheDocument()
    })

    it('should render 429 error', () => {
      render(<ErrorMessage error={{status: 429}} type="post" compact />)

      expect(screen.getByText(/Too many requests/)).toBeInTheDocument()
    })

    it('should render 500 error', () => {
      render(<ErrorMessage error={{status: 500}} type="generic" compact />)

      expect(
        screen.getByText(/Reddit servers are experiencing issues/)
      ).toBeInTheDocument()
    })
  })

  describe('Full mode', () => {
    it('should render 404 error for subreddit with button', () => {
      render(
        <ErrorMessage
          error={{status: 404}}
          type="subreddit"
          resourceName="banned"
          fallbackUrl="/"
        />
      )

      expect(screen.getByText(/Subreddit Not Available/)).toBeInTheDocument()
      expect(
        screen.getByText(/Subreddit r\/banned not found/)
      ).toBeInTheDocument()
      expect(screen.getByRole('link', {name: /Go to Home/})).toHaveAttribute(
        'href',
        '/'
      )
    })

    it('should render 403 error for user with button', () => {
      render(
        <ErrorMessage
          error={{status: 403}}
          type="user"
          resourceName="privateuser"
          fallbackUrl="/"
        />
      )

      expect(screen.getByText(/Profile Not Available/)).toBeInTheDocument()
      expect(
        screen.getByText(/Access denied to u\/privateuser/)
      ).toBeInTheDocument()
      expect(screen.getByRole('link', {name: /Go to Home/})).toHaveAttribute(
        'href',
        '/'
      )
    })

    it('should render default error for unknown status', () => {
      render(<ErrorMessage error={{status: 418}} type="subreddit" />)

      expect(
        screen.getByText(/Unable to load posts from Reddit/)
      ).toBeInTheDocument()
    })

    it('should render generic error for non-status error', () => {
      render(<ErrorMessage error={{message: 'Network error'}} type="post" />)

      expect(screen.getByText(/An error occurred/)).toBeInTheDocument()
    })
  })
})
