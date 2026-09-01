import { useEffect } from 'react'
import styles from './toast.module.css'

export default function Toast({ message, visible, onClose, title = 'Task saved' }) {
  useEffect(() => {
    if (!visible) {
      return undefined
    }

    const timer = window.setTimeout(() => onClose(), 2600)
    return () => window.clearTimeout(timer)
  }, [visible, onClose])

  if (!visible) {
    return null
  }

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  )
}
