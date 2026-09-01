import styles from './documentCard.module.css'

export default function DocumentCard({ document, onPreview, onDownload, onRename, onDelete }) {
  return (
    <article className={styles.card}>
      <div className={styles.preview}>
        <div className={styles.previewBadge}>{document.type}</div>
      </div>
      <div className={styles.body}>
        <strong>{document.title}</strong>
        <p>{document.owner}</p>
      </div>
      <div className={styles.meta}>
        <span>{document.updated}</span>
        <span>{document.size}</span>
      </div>
      <div className={styles.actions}>
        {onDownload ? (
          <button className="ghost-btn" type="button" onClick={() => onDownload(document)}>
            Download
          </button>
        ) : null}
        <button className="ghost-btn" type="button" onClick={() => onPreview(document)}>
          Preview
        </button>
        <button className="ghost-btn" type="button" onClick={() => onRename(document)}>
          Rename
        </button>
        <button className="ghost-btn" type="button" onClick={() => onDelete(document)}>
          Delete
        </button>
      </div>
    </article>
  )
}
