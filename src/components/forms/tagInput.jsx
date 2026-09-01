import { useState } from 'react'
import styles from './formControls.module.css'

export default function TagInput({ label, value = [], onChange, name, error, required }) {
  const [draft, setDraft] = useState('')
  const tags = Array.isArray(value) ? value : []

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const addTag = (nextTag) => {
    const sanitized = nextTag.trim()

    if (!sanitized || tags.includes(sanitized)) {
      return
    }

    onChange([...tags, sanitized])
    setDraft('')
  }

  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}> *</span> : null}
      </span>
      <div className={`${styles.tagInput} ${error ? styles.inputError : ''}`.trim()}>
        {tags.map((tag) => (
          <span className={styles.tagChip} key={tag}>
            {tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => removeTag(tag)}>
              ×
            </button>
          </span>
        ))}
        <input
          name={name}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addTag(draft)
            }
          }}
          placeholder="Add tag"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
      {error ? (
        <span id={`${name}-error`} className={styles.errorText}>
          {error}
        </span>
      ) : null}
    </label>
  )
}
