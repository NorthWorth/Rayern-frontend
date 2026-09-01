import styles from './taskEmptyState.module.css'
import { Plus } from '@phosphor-icons/react'

export default function TaskEmptyState({ onCreate }) {
  return (
    <div className={styles.emptyState}>
      <h3>No tasks found matching the current view</h3>
      <p>Try a broader search or create a new task to populate the workspace.</p>
      <button className="primary-btn" type="button" onClick={onCreate}>

        <Plus size={15} weight="bold" aria-hidden="true" />

        New Task
      </button>
    </div>
  )
}
