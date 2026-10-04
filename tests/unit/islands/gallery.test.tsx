// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GalleryItem } from '@/lib/view-models'
import { imageSet } from '@/tests/helpers/views'

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const { Gallery } = await import('@/components/media/gallery')

let reducedMotion = false
beforeEach(() => {
  reducedMotion = false
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  // happy-dom's <dialog> lacks the modal API.
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  Object.defineProperty(HTMLDialogElement.prototype, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open')
    },
  })
  HTMLElement.prototype.scrollTo = vi.fn()
  HTMLElement.prototype.scrollBy = vi.fn()
})
afterEach(() => {
  cleanup()
  Reflect.deleteProperty(document, 'startViewTransition')
})

const items: GalleryItem[] = [
  {
    media: { type: 'image', image: imageSet({ src: 'https://i.redd.it/1.jpg' }) },
    caption: 'One',
    outboundUrl: null,
  },
  {
    media: { type: 'image', image: imageSet({ src: 'https://i.redd.it/2.jpg' }) },
    caption: null,
    outboundUrl: null,
  },
  {
    media: {
      type: 'animated',
      loop: { mp4: 'https://i.redd.it/3.mp4', width: 1, height: 1 },
      gif: null,
      poster: null,
    },
    caption: null,
    outboundUrl: null,
  },
]

function openAt(index: number) {
  const link = document.querySelectorAll<HTMLAnchorElement>(
    'ul[aria-roledescription] a[data-index]',
  )[index]!
  act(() => {
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
  })
  return link
}

describe('GalleryLightbox', () => {
  it('opens the dialog at the tapped image and announces it', () => {
    render(<Gallery items={items} title="Trip" postId="p1" />)
    const dialog = document.querySelector('dialog')!
    expect(dialog.open).toBe(false)
    openAt(1)
    expect(dialog.open).toBe(true)
    expect(screen.getByText('Image 2 of 2')).toBeTruthy()
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled()
  })

  it('morphs with a view transition unless motion is reduced', async () => {
    const finished = Promise.resolve()
    const startViewTransition = vi.fn((update: () => void) => {
      update()
      return { finished }
    })
    Object.assign(document, { startViewTransition })
    render(<Gallery items={items} title="Trip" postId="p1" />)
    openAt(0)
    expect(startViewTransition).toHaveBeenCalledOnce()
    await act(async () => finished)
    expect(document.querySelector('dialog img')?.getAttribute('style') ?? '').not.toContain(
      'gallery-hero',
    )

    cleanup()
    reducedMotion = true
    render(<Gallery items={items} title="Trip" postId="p1" />)
    openAt(0)
    expect(startViewTransition).toHaveBeenCalledOnce()
  })

  it('moves with the arrow keys, updates the count after scrolling, and returns focus on close', () => {
    render(<Gallery items={items} title="Trip" postId="p1" />)
    const link = openAt(0)
    const dialog = document.querySelector('dialog')!
    const track = dialog.querySelector('ul')!
    act(() => {
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalledTimes(2)
    Object.defineProperty(track, 'clientWidth', { value: 100, configurable: true })
    track.scrollLeft = 100
    act(() => {
      track.dispatchEvent(new Event('scrollend'))
    })
    expect(screen.getByText('Image 2 of 2')).toBeTruthy()
    const focus = vi.spyOn(link, 'focus')
    act(() => dialog.close())
    expect(focus).toHaveBeenCalled()
  })

  it('leaves modified clicks, other clicks, and unmatched slides alone', () => {
    render(<Gallery items={items} title="Trip" postId="p1" />)
    const dialog = document.querySelector('dialog')!
    const link = document.querySelector<HTMLAnchorElement>(
      'ul[aria-roledescription] a[data-index]',
    )!
    act(() => {
      link.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }),
      )
      document.querySelector('section')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(dialog.open).toBe(false)
    dialog.querySelector('li')!.removeAttribute('data-index')
    openAt(0)
    expect(dialog.open).toBe(true)
    expect(screen.getByText('Image 1 of 1')).toBeTruthy()
  })

  it('closes an open lightbox when the route goes away', () => {
    const { unmount } = render(<Gallery items={items} title="Trip" postId="p1" />)
    const dialog = document.querySelector('dialog')!
    openAt(0)
    unmount()
    expect(dialog.open).toBe(false)
  })

  it('loads the full-size images only while the lightbox is open', () => {
    const { unmount } = render(
      <Gallery
        items={[
          items[0]!,
          {
            media: {
              type: 'image',
              image: imageSet({ src: 'https://i.redd.it/2.jpg', srcSet: '' }),
            },
            caption: null,
            outboundUrl: null,
          },
        ]}
        title="Trip"
        postId="p1"
      />,
    )
    const dialog = document.querySelector('dialog')!
    const [first, second] = dialog.querySelectorAll('img')
    expect(first!.getAttribute('src')).toBeNull()
    expect(first!.dataset.src).toBe('https://i.redd.it/1.jpg')

    openAt(0)
    expect(first!.getAttribute('src')).toBe('https://i.redd.it/1.jpg')
    expect(first!.getAttribute('srcset')).toContain('320w')
    expect(first!.getAttribute('sizes')).toBe('100vw')
    expect(second!.getAttribute('src')).toBe('https://i.redd.it/2.jpg')
    expect(second!.getAttribute('srcset')).toBeNull()

    act(() => dialog.close())
    expect(first!.getAttribute('src')).toBeNull()
    expect(first!.getAttribute('srcset')).toBeNull()

    openAt(0)
    unmount()
    expect(first!.getAttribute('src')).toBeNull()
  })
})
