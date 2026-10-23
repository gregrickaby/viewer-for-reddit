'use client'

import { useOptimistic, useRef, type KeyboardEvent } from 'react'

import { editComment, postComment } from '@/app/actions/comments'

import styles from './comment-composer.module.css'
import { COMMENT_MAX_CHARS, EDIT_HINT, placeholderFor, REPLY_HINT } from './composer-copy'
import { PendingButton } from './pending-button'
import { useEnhancedForm } from './use-enhanced-form'

interface PendingComment {
  key: string
  text: string
}

export type CommentComposerProps =
  | { mode: 'reply'; parent: string; me: string; label: string }
  | { mode: 'edit'; thing: string; initial: string }

/** ⌘/Ctrl+Enter submits, like Reddit. */
function submitOnShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }
}

/** Closes the `<details>` (reply or edit) the form sits in, if any. */
function closeEnclosingDetails(form: HTMLFormElement | null) {
  form?.closest('details')?.removeAttribute('open')
}

/**
 * Writes a comment or edits one. The textarea clears at once
 * and a faded pending comment shows until the server re-render arrives with
 * the real one; on failure the draft comes back with Reddit's reason.
 */
export function CommentComposer(props: CommentComposerProps) {
  return props.mode === 'reply' ? <ReplyComposer {...props} /> : <EditComposer {...props} />
}

function ReplyComposer({ parent, me, label }: Extract<CommentComposerProps, { mode: 'reply' }>) {
  const formRef = useRef<HTMLFormElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const draft = useRef('')
  const [pending, addPending] = useOptimistic<PendingComment[], PendingComment>(
    [],
    (list, item) => [...list, item],
  )

  const { formProps, isPending, error } = useEnhancedForm(postComment, {
    optimistic: (formData) => {
      draft.current = String(formData.get('text') ?? '')
      addPending({ key: `${Date.now()}`, text: draft.current.trim() })
      formRef.current?.reset()
    },
    settled: (result) => {
      if (result.ok) {
        // The real comment arrives with the refreshed thread; a reply box closes itself.
        if (parent.startsWith('t1_')) closeEnclosingDetails(formRef.current)
      } else if (textRef.current) {
        textRef.current.value = draft.current
      }
    },
  })

  return (
    <div className={styles.root}>
      <form ref={formRef} {...formProps} className={styles.form}>
        <input name="parent" type="hidden" value={parent} />
        <label className="visually-hidden" htmlFor={`text-${parent}`}>
          {label}
        </label>
        <textarea
          className={styles.text}
          id={`text-${parent}`}
          maxLength={COMMENT_MAX_CHARS}
          name="text"
          onKeyDown={submitOnShortcut}
          placeholder={placeholderFor(parent)}
          ref={textRef}
          required
          rows={3}
        />
        <div className={styles.bar}>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : (
            <span className={styles.hint}>{REPLY_HINT}</span>
          )}
          <PendingButton pending={isPending}>{label}</PendingButton>
        </div>
      </form>
      {pending.length > 0 ? (
        <ol aria-live="polite" className={styles.pendingList} role="list">
          {pending.map((comment) => (
            <li className={styles.pending} key={comment.key}>
              <p className={styles.pendingMeta}>u/{me} · sending…</p>
              <p className={styles.pendingText}>{comment.text}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}

function EditComposer({ thing, initial }: Extract<CommentComposerProps, { mode: 'edit' }>) {
  const formRef = useRef<HTMLFormElement>(null)
  const { formProps, isPending, error } = useEnhancedForm(editComment, {
    optimistic: () => {},
    settled: (result) => {
      if (result.ok) closeEnclosingDetails(formRef.current)
    },
  })

  return (
    <form ref={formRef} {...formProps} className={styles.form}>
      <input name="thing" type="hidden" value={thing} />
      <label className="visually-hidden" htmlFor={`edit-${thing}`}>
        Edit comment
      </label>
      <textarea
        className={styles.text}
        defaultValue={initial}
        id={`edit-${thing}`}
        maxLength={COMMENT_MAX_CHARS}
        name="text"
        onKeyDown={submitOnShortcut}
        required
        rows={4}
      />
      <div className={styles.bar}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          <span className={styles.hint}>{EDIT_HINT}</span>
        )}
        <PendingButton pending={isPending}>Save edit</PendingButton>
      </div>
    </form>
  )
}
