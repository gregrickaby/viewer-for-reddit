import { editComment, postComment } from '@/app/actions/comments'
import type { CommentComposerProps } from '@/components/islands/comment-composer'
import {
  COMMENT_MAX_CHARS,
  EDIT_HINT,
  REPLY_HINT,
  placeholderFor,
} from '@/components/islands/composer-copy'
import { Button } from '@/components/ui/button'
import { formAction } from '@/lib/actions/form-action'
import styles from '@/components/islands/comment-composer.module.css'

/**
 * The composer's markup as a Server Component: what a closed `ComposerDetails`
 * holds, so a thread doesn't hydrate a composer for every comment. It posts
 * without JavaScript, like the island it stands in for.
 */
export function ComposerForm(props: CommentComposerProps) {
  if (props.mode === 'edit') {
    return (
      <form action={formAction(editComment)} className={styles.form}>
        <input type="hidden" name="thing" value={props.thing} />
        <label className="visually-hidden" htmlFor={`edit-${props.thing}`}>
          Edit comment
        </label>
        <textarea
          id={`edit-${props.thing}`}
          name="text"
          className={styles.text}
          defaultValue={props.initial}
          maxLength={COMMENT_MAX_CHARS}
          required
          rows={4}
        />
        <div className={styles.bar}>
          <span className={styles.hint}>{EDIT_HINT}</span>
          <Button type="submit" size="sm">
            Save edit
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className={styles.root}>
      <form action={formAction(postComment)} className={styles.form}>
        <input type="hidden" name="parent" value={props.parent} />
        <label className="visually-hidden" htmlFor={`text-${props.parent}`}>
          {props.label}
        </label>
        <textarea
          id={`text-${props.parent}`}
          name="text"
          className={styles.text}
          placeholder={placeholderFor(props.parent)}
          maxLength={COMMENT_MAX_CHARS}
          required
          rows={3}
        />
        <div className={styles.bar}>
          <span className={styles.hint}>{REPLY_HINT}</span>
          <Button type="submit" size="sm">
            {props.label}
          </Button>
        </div>
      </form>
    </div>
  )
}
