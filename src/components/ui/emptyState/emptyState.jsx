import { Tray } from '@phosphor-icons/react'

import styles from './emptyState.module.css'

export default function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Tray }) {
  return (
    <div className={styles.emptyState} role="status">
      <div className={styles.illustration} aria-hidden="true">
        <Icon size={34} weight="duotone" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? (
        <button className="primary-btn" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
