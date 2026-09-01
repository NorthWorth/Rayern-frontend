// Shared display formatters.

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }

  const gigabyte = 1024 * 1024 * 1024

  if (bytes >= gigabyte) {
    const gb = Math.round((bytes / gigabyte) * 10) / 10
    return `${gb} GB`
  }

  if (bytes >= 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}
