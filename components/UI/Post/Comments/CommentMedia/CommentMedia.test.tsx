import {render, screen} from '@/test-utils'
import {describe, expect, it} from 'vitest'
import {CommentMedia} from './CommentMedia'

describe('CommentMedia', () => {
  it('should render nothing for HTML with no media links', () => {
    const html =
      '<div>Just text with <a href="https://reddit.com">link</a></div>'
    render(<CommentMedia bodyHtml={html} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('should render image for image link', () => {
    const html = '<div><a href="https://i.redd.it/cat.jpg">cat pic</a></div>'
    render(<CommentMedia bodyHtml={html} />)

    const img = screen.getByRole('img', {name: /cat pic/i})
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://i.redd.it/cat.jpg')
  })

  it('should render video for gif link', () => {
    const html = '<div><a href="https://i.imgur.com/cat.gif">cat gif</a></div>'
    render(<CommentMedia bodyHtml={html} />)

    const video = screen.getByTestId('comment-video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://i.imgur.com/cat.gif')
    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveAttribute('loop')
  })

  it('should render video for gifv link with normalized URL', () => {
    const html =
      '<div><a href="https://i.imgur.com/cat.gifv">cat gifv</a></div>'
    render(<CommentMedia bodyHtml={html} />)

    const video = screen.getByTestId('comment-video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://i.imgur.com/cat.mp4')
  })

  it('should render multiple media items', () => {
    const html = `
      <div>
        <a href="https://i.redd.it/cat1.jpg">cat 1</a>
        <a href="https://i.imgur.com/cat2.gif">cat 2</a>
      </div>
    `
    render(<CommentMedia bodyHtml={html} />)

    expect(screen.getByRole('img', {name: /cat 1/i})).toBeInTheDocument()
    expect(screen.getByTestId('comment-video')).toBeInTheDocument()
  })

  it('should use fallback alt text when link text is empty', () => {
    const html = '<div><a href="https://i.redd.it/cat.jpg"></a></div>'
    render(<CommentMedia bodyHtml={html} />)

    const img = screen.getByRole('img', {name: /comment image/i})
    expect(img).toBeInTheDocument()
  })

  it('should handle empty HTML', () => {
    render(<CommentMedia bodyHtml="" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('should handle malformed HTML gracefully', () => {
    const html = '<div><a href=>broken</a></div>'
    render(<CommentMedia bodyHtml={html} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
