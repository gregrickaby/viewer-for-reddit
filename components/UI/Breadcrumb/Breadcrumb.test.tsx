import {render, screen} from '@/test-utils'
import {Breadcrumb} from './Breadcrumb'

describe('Breadcrumb', () => {
  it('should render Home as current page when no items provided', () => {
    render(<Breadcrumb items={[]} />)

    const homeCurrent = screen.getByText('Home')
    expect(homeCurrent).toBeInTheDocument()
    expect(homeCurrent).toHaveAttribute('aria-current', 'page')
    expect(homeCurrent.tagName).toBe('SPAN')
  })

  it('should render single item with Home link and current page', () => {
    render(<Breadcrumb items={[{label: 'About', href: '/about'}]} />)

    const homeLink = screen.getByRole('link', {name: 'Home'})
    expect(homeLink).toHaveAttribute('href', '/')

    const currentPage = screen.getByText('About')
    expect(currentPage).toBeInTheDocument()
    expect(currentPage).toHaveAttribute('aria-current', 'page')
    expect(currentPage.tagName).toBe('SPAN')
  })

  it('should render multiple items with last item as current page', () => {
    render(
      <Breadcrumb
        items={[
          {label: 'r/technology', href: '/r/technology'},
          {label: 'Post Title', href: '/r/technology/comments/123'}
        ]}
      />
    )

    const homeLink = screen.getByRole('link', {name: 'Home'})
    expect(homeLink).toHaveAttribute('href', '/')

    const subredditLink = screen.getByRole('link', {name: 'r/technology'})
    expect(subredditLink).toHaveAttribute('href', '/r/technology')

    const currentPage = screen.getByText('Post Title')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
    expect(currentPage.tagName).toBe('SPAN')
  })

  it('should have accessible navigation landmark', () => {
    render(<Breadcrumb items={[{label: 'About', href: '/about'}]} />)

    const nav = screen.getByRole('navigation', {name: 'Breadcrumb'})
    expect(nav).toBeInTheDocument()
  })

  it('should use ordered list for semantic structure', () => {
    render(<Breadcrumb items={[{label: 'About', href: '/about'}]} />)

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
  })

  it('should hide separators from screen readers', () => {
    render(
      <Breadcrumb
        items={[
          {label: 'r/technology', href: '/r/technology'},
          {label: 'Post Title', href: '/r/technology/comments/123'}
        ]}
      />
    )

    // Separators are visual only, hidden from assistive tech
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveTextContent('/')
  })

  it('should include structured data for SEO', () => {
    const {container} = render(
      <Breadcrumb
        items={[
          {label: 'r/technology', href: '/r/technology'},
          {label: 'Post Title', href: '/r/technology/comments/123'}
        ]}
      />
    )

    // eslint-disable-next-line testing-library/no-container
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()

    if (script?.textContent) {
      const structuredData = JSON.parse(script.textContent)
      expect(structuredData['@type']).toBe('BreadcrumbList')
      expect(structuredData.itemListElement).toHaveLength(3)
      expect(structuredData.itemListElement[0].name).toBe('Home')
      expect(structuredData.itemListElement[1].name).toBe('r/technology')
      expect(structuredData.itemListElement[2].name).toBe('Post Title')
    }
  })

  it('should not make the last item a link', () => {
    render(
      <Breadcrumb
        items={[
          {label: 'r/technology', href: '/r/technology'},
          {label: 'Current Page', href: '/r/technology/comments/123'}
        ]}
      />
    )

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2) // Home and r/technology only

    const currentPage = screen.getByText('Current Page')
    expect(currentPage.tagName).toBe('SPAN')
  })

  it('should render breadcrumb items in correct order', () => {
    render(
      <Breadcrumb
        items={[
          {label: 'r/technology', href: '/r/technology'},
          {label: 'Post Title', href: '/r/technology/comments/123'}
        ]}
      />
    )

    const homeLink = screen.getByRole('link', {name: 'Home'})
    expect(homeLink).toBeInTheDocument()

    const subredditLink = screen.getByRole('link', {name: 'r/technology'})
    expect(subredditLink).toBeInTheDocument()

    const currentPage = screen.getByText('Post Title')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })
})
