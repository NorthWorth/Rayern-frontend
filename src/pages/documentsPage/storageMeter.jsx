import styles from './storageMeter.module.css'

// Compact Rayern storage indicator. Numbers come from
// GET /files/storage — the backend's authoritative
// values. Provider details are deliberately invisible.
export default function StorageMeter({ storage }) {
  if (!storage || !storage.limitBytes) {
    return null
  }

  const percent = Math.min(
    100,
    Math.round(
      ((storage.usedBytes ?? 0) /
        storage.limitBytes) *
        100,
    ),
  )

  const nearlyFull = percent >= 90

  return (
    <div
      className={styles.storageMeter}
      role="status"
      aria-label={`Rayern storage: ${percent}% used`}
    >
      <div className={styles.storageHeader}>
        <span>Rayern Storage</span>

        <strong>
          {formatGigabytes(storage.usedBytes)} /{' '}
          {formatGigabytes(storage.limitBytes)} used
        </strong>
      </div>

      <div
        className={styles.storageBar}
        aria-hidden="true"
      >
        <div
          className={`${styles.storageFill}${
            nearlyFull ? ` ${styles.storageFillWarning}` : ''
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function formatGigabytes(bytes) {
  const gigabyte = 1024 * 1024 * 1024

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 GB'
  }

  const value =
    bytes >= gigabyte
      ? Math.round((bytes / gigabyte) * 10) / 10
      : Math.max(1, Math.round(bytes / (1024 * 1024)))

  return `${value} ${bytes >= gigabyte ? 'GB' : 'MB'}`
}
