import styles from './formControls.module.css'

export default function Textarea({ label, name, value, onChange, placeholder, error, required, ...rest }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}> *</span> : null}
      </span>
      <textarea
        className={`${styles.textarea} ${error ? styles.inputError : ''}`.trim()}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${name}-error`} className={styles.errorText}>
          {error}
        </span>
      ) : null}
    </label>
  )
}
