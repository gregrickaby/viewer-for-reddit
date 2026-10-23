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
      aria-checked={checked}
      aria-describedby={description ? descriptionId : undefined}
      className={styles.row}
      role="switch"
      type="submit"
    >
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? (
          <span className={styles.description} id={descriptionId}>
            {description}
          </span>
        ) : null}
      </span>
      <span aria-hidden="true" className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </button>
  )
}
