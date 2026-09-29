import { useId } from 'react'
import styles from './switch-row.module.css'

/**
 * A settings row (the usual pattern): a title with a one-line explanation on
 * the left, a switch on the right. The whole row is the button, so it is a
 * large target, and the explanation is its accessible description.
 */
export function SwitchRow({
  label,
  description,
  checked,
}: {
  label: string
  description?: string
  checked: boolean
}) {
  const descriptionId = useId()
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? descriptionId : undefined}
      className={styles.row}
    >
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        ) : null}
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </button>
  )
}
