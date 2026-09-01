import { UploadSimple } from '@phosphor-icons/react'

import styles from './uploadZone.module.css'

export default function UploadZone({ onFilesSelected, isBusy = false }) {
  return (
    <label className={styles.zone}>
      <input
        className={styles.input}
        type="file"
        multiple
        disabled={isBusy}
        aria-label="Upload documents"
        onChange={(event) => onFilesSelected(event.target.files)}
      />
      <span className={styles.icon} aria-hidden="true">
        <UploadSimple size={22} weight="bold" />
      </span>
      <strong>{isBusy ? 'Uploading…' : 'Drag and drop files here'}</strong>
      <span className={styles.helper}>or click to browse</span>
    </label>
  )
}
