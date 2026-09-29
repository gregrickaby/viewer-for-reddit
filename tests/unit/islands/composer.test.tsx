// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '@/lib/actions/result'

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

type Action<T> = (formData: FormData) => Promise<ActionResult<T>>
const pending = {
  post: deferred<ActionResult<{ id: string | null }>>(),
  edit: deferred<ActionResult>(),
}
const postComment = vi.fn<Action<{ id: string | null }>>(() => pending.post.promise)
const editComment = vi.fn<Action<void>>(() => pending.edit.promise)
vi.mock('@/app/actions/comments', () => ({ postComment, editComment, deleteComment: vi.fn() }))

const { CommentComposer } = await import('@/components/islands/comment-composer')
const { PendingButton } = await import('@/components/islands/pending-button')

const locked = {
  ok: false as const,
  error: { code: 'REDDIT' as const, message: 'This thread is locked.' },
}

beforeEach(() => {
  pending.post = deferred()
  pending.edit = deferred()
  postComment.mockClear()
  editComment.mockClear()
})
afterEach(cleanup)

function typeAndSend(text: string) {
  const box = screen.getByRole('textbox') as HTMLTextAreaElement
  fireEvent.change(box, { target: { value: text } })
  return act(async () => fireEvent.click(screen.getByRole('button')))
}

describe('CommentComposer (reply)', () => {
  it('clears the box and shows a pending comment at once', async () => {
    render(<CommentComposer mode="reply" parent="t3_abc" me="spez" label="Comment" />)
    await typeAndSend('First!')
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('')
    expect(screen.getByText('First!')).toBeTruthy()
    expect(screen.getByText('u/spez · sending…')).toBeTruthy()
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true')
    expect(Object.fromEntries(postComment.mock.calls[0]![0])).toEqual({
      parent: 't3_abc',
      text: 'First!',
    })

    await act(async () => pending.post.resolve({ ok: true, data: { id: 'new1' } }))
    expect(screen.queryByText('First!')).toBeNull()
  })

  it('restores the draft and shows Reddit’s reason on failure', async () => {
    render(<CommentComposer mode="reply" parent="t3_abc" me="spez" label="Comment" />)
    await typeAndSend('Too late')
    await act(async () => pending.post.resolve(locked))
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Too late')
    expect(screen.getByRole('alert').textContent).toBe('This thread is locked.')
  })

  it('closes a reply box after a successful reply', async () => {
    render(
      <details open>
        <summary>Reply</summary>
        <CommentComposer mode="reply" parent="t1_abc" me="spez" label="Reply" />
      </details>,
    )
    expect(screen.getByRole('textbox').getAttribute('placeholder')).toBe('Write a reply…')
    await typeAndSend('Agreed')
    await act(async () => pending.post.resolve({ ok: true, data: { id: 'n' } }))
    expect(document.querySelector('details')!.hasAttribute('open')).toBe(false)
  })

  it('sends with ⌘/Ctrl+Enter and ignores a plain Enter', () => {
    render(<CommentComposer mode="reply" parent="t3_abc" me="spez" label="Comment" />)
    const form = document.querySelector('form')!
    const requestSubmit = vi.fn()
    Object.assign(form, { requestSubmit })
    const box = screen.getByRole('textbox')
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(requestSubmit).not.toHaveBeenCalled()
    fireEvent.keyDown(box, { key: 'Enter', metaKey: true })
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true })
    expect(requestSubmit).toHaveBeenCalledTimes(2)
  })
})

describe('CommentComposer (edit)', () => {
  it('prefills the markdown, saves, and closes', async () => {
    render(
      <details open>
        <summary>Edit</summary>
        <CommentComposer mode="edit" thing="t1_abc" initial="Old text" />
      </details>,
    )
    const box = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(box.value).toBe('Old text')
    fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true })
    await typeAndSend('New text')
    expect(Object.fromEntries(editComment.mock.calls.at(-1)![0])).toEqual({
      thing: 't1_abc',
      text: 'New text',
    })
    await act(async () => pending.edit.resolve({ ok: true, data: undefined }))
    expect(document.querySelector('details')!.hasAttribute('open')).toBe(false)
  })

  it('keeps the form open with the reason on failure', async () => {
    render(<CommentComposer mode="edit" thing="t1_abc" initial="Old" />)
    await typeAndSend('New')
    await act(async () => pending.edit.resolve(locked))
    expect(screen.getByRole('alert').textContent).toBe('This thread is locked.')
  })
})

describe('PendingButton', () => {
  it('reflects the form status unless told otherwise', () => {
    render(
      <form>
        <PendingButton>Go</PendingButton>
        <PendingButton pending variant="ghost">
          Busy
        </PendingButton>
      </form>,
    )
    expect(screen.getByText('Go').getAttribute('aria-busy')).toBe('false')
    expect(screen.getByText('Busy').hasAttribute('disabled')).toBe(true)
  })
})
