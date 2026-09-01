import styles from './formControls.module.css'

export default function Select({ label, name, value, onChange, options, error, required, placeholder, ...rest }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}> *</span> : null}
      </span>
      <select
        className={`${styles.select} ${error ? styles.inputError : ''}`.trim()}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={`${name}-error`} className={styles.errorText}>
          {error}
        </span>
      ) : null}
    </label>
  )
}
