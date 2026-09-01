import styles from './pagination.module.css'

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className={styles.pagination} aria-label="Pagination controls">
      <button type="button" className="ghost-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button type="button" className="ghost-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  )
}
