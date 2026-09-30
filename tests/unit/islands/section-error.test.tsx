// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SectionError } from '@/components/islands/section-error'

const { addNextjsError } = vi.hoisted(() => ({ addNextjsError: vi.fn() }))
vi.mock('@datadog/browser-rum-nextjs', () => ({ addNextjsError }))

afterEach(cleanup)

function Broken(): never {
  throw new Error('Reddit is down')
}

describe('SectionError', () => {
  it('renders its children when nothing fails', () => {
    render(
      <SectionError title="Couldn’t load posts">
        <p>posts</p>
      </SectionError>,
    )
    expect(screen.getByText('posts')).toBeTruthy()
  })

  it('replaces only its section with a message and a retry button', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <div>
        <p>header</p>
        <SectionError title="Couldn’t load posts">
          <Broken />
        </SectionError>
      </div>,
    )
    expect(screen.getByText('header')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t load posts')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
    expect(addNextjsError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Reddit is down' }),
    )
  })
})
