import Modal from '../modal/modal.jsx'
import styles from './confirmDialog.module.css'

export default function ConfirmDialog({ open, title, message, onClose, onConfirm, confirmLabel = 'Delete' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Confirm action"
      footer={
        <>
          <button className="ghost-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  )
}
