import { editComment, postComment } from '@/app/actions/comments'
import type { CommentComposerProps } from '@/components/islands/comment-composer'
import styles from '@/components/islands/comment-composer.module.css'
import {
  COMMENT_MAX_CHARS,
  EDIT_HINT,
  placeholderFor,
  REPLY_HINT,
} from '@/components/islands/composer-copy'
import { Button } from '@/components/ui/button'
import { formAction } from '@/lib/actions/form-action'

/**
 * The composer's markup as a Server Component: what a closed `ComposerDetails`
 * holds, so a thread doesn't hydrate a composer for every comment. It posts
 * without JavaScript, like the island it stands in for.
 */
export function ComposerForm(props: CommentComposerProps) {
  if (props.mode === 'edit') {
    return (
      <form action={formAction(editComment)} className={styles.form}>
        <input name="thing" type="hidden" value={props.thing} />
        <label className="visually-hidden" htmlFor={`edit-${props.thing}`}>
          Edit comment
        </label>
        <textarea
          className={styles.text}
          defaultValue={props.initial}
          id={`edit-${props.thing}`}
          maxLength={COMMENT_MAX_CHARS}
          name="text"
          required
          rows={4}
        />
        <div className={styles.bar}>
          <span className={styles.hint}>{EDIT_HINT}</span>
          <Button size="sm" type="submit">
            Save edit
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className={styles.root}>
      <form action={formAction(postComment)} className={styles.form}>
        <input name="parent" type="hidden" value={props.parent} />
        <label className="visually-hidden" htmlFor={`text-${props.parent}`}>
          {props.label}
        </label>
        <textarea
          className={styles.text}
          id={`text-${props.parent}`}
          maxLength={COMMENT_MAX_CHARS}
          name="text"
          placeholder={placeholderFor(props.parent)}
          required
          rows={3}
        />
        <div className={styles.bar}>
          <span className={styles.hint}>{REPLY_HINT}</span>
          <Button size="sm" type="submit">
            {props.label}
          </Button>
        </div>
      </form>
    </div>
  )
}
