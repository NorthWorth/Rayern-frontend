import { forwardRef } from 'react'
import styles from './formControls.module.css'

const Input = forwardRef(function Input({ label, name, value, onChange, type = 'text', placeholder, error, required, autoFocus, leadingIcon: LeadingIcon, ...rest }, ref) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.required}> *</span> : null}
      </span>
      <span className={`${styles.inputWrap} ${LeadingIcon ? styles.inputWrapWithIcon : ''}`.trim()}>
        {LeadingIcon ? <LeadingIcon className={styles.inputIcon} size={16} weight="bold" aria-hidden="true" /> : null}
        <input
          ref={ref}
          className={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...rest}
        />
      </span>
      {error ? (
        <span id={`${name}-error`} className={styles.errorText}>
          {error}
        </span>
      ) : null}
    </label>
  )
})

export default Input
