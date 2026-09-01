import { Link } from 'react-router-dom'

import styles from './taskCard.module.css'

const priorityClass = {
  High: 'high',
  Medium: 'medium',
  Low: 'low',
}

const statusClass = {
  Todo: 'todo',
  'In Progress': 'inprogress',
  Completed: 'completed',
}

function getTaskId(task) {
  return task?._id ?? task?.id
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
}) {
  const taskId = getTaskId(task)

  return (
    <article
      className={styles.card}
      draggable
      onDragStart={(event) => onDragStart(event, taskId)}
      onDragOver={onDragOver}
    >
      <div className={styles.topRow}>
        <span
          className={`${styles.tag} ${styles[priorityClass[task.priority]]}`}
        >
          {task.priority}
        </span>

        <span
          className={`${styles.tag} ${styles[statusClass[task.status]]}`}
        >
          {task.status}
        </span>
      </div>

      <div className={styles.body}>
        <Link
          to={`/tasks/${taskId}`}
          className={styles.titleLink}
        >
          <strong>{task.title}</strong>
        </Link>

        <p>
          {task.description || 'No description provided yet.'}
        </p>
      </div>

      <div className={styles.meta}>
        <span>
          {task.project?.name
            ? `Project: ${task.project.name}`
            : 'No project'}
        </span>

        <span>
          {task.dueDate
            ? `Due ${String(task.dueDate).slice(0, 10)}`
            : 'No due date'}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          className="ghost-btn"
          type="button"
          onClick={() => onEdit(task)}
        >
          Edit
        </button>

        <button
          className="ghost-btn"
          type="button"
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </article>
  )
}