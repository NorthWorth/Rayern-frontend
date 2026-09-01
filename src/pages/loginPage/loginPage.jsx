import { useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Eye, EyeSlash } from '@phosphor-icons/react'

import { useAuth } from '../../context/authContext.jsx'

import styles from './loginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { login } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setFieldErrors((current) => ({
      ...current,
      [name]: '',
    }))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setFieldErrors({})

    if (!form.email.trim()) {
      setFieldErrors((current) => ({
        ...current,
        email: 'Email address is required.',
      }))

      return
    }

    if (!form.password) {
      setFieldErrors((current) => ({
        ...current,
        password: 'Password is required.',
      }))

      return
    }

    setIsSubmitting(true)

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      })

      const destination =
        location.state?.from || '/dashboard'

      navigate(destination, {
        replace: true,
      })
    } catch (loginError) {
      if (loginError?.fields) {
        setFieldErrors(loginError.fields)
      }

      setError(
        loginError?.fields &&
          Object.keys(loginError.fields).length
          ? ''
          : loginError?.message ||
              'Unable to sign in. Please check your credentials.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.brandPanel}>
          <div className={styles.brand}>
            <div
              className={styles.brandMark}
              aria-hidden="true"
            >
              <img
                src="/rayern-favicons.webp"
                alt=""
                className={styles.brandMarkIcon}
              />
            </div>

            <div>
              <strong>RAYERN</strong>
              <span>Client workspace</span>
            </div>
          </div>

          <div className={styles.brandContent}>
            <span className={styles.eyebrow}>
              Welcome back
            </span>

            <h1>
              Everything about your clients,
              <span> in one place.</span>
            </h1>

            <p>
              Manage client relationships, projects,
              tasks, deliverables, meetings, and
              documents from one organized workspace.
            </p>
          </div>

          <div className={styles.brandFooter}>
            <span>
              Built for modern service businesses.
            </span>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formContainer}>
            <div className={styles.mobileBrand}>
              <div
                className={styles.brandMark}
                aria-hidden="true"
              >
                <img
                  src="/rayern-favicons.webp"
                  alt=""
                  className={styles.brandMarkIcon}
                />
              </div>

              <div>
                <strong>RAYERN</strong>
                <span>Client workspace</span>
              </div>
            </div>

            <div className={styles.formHeader}>
              <span className={styles.eyebrow}>
                Sign in
              </span>

              <h2>Welcome back</h2>

              <p>
                Sign in to continue to your
                Rayern workspace.
              </p>
            </div>

            <form
              className={styles.form}
              onSubmit={handleSubmit}
              noValidate
            >
              {error && (
                <div
                  className={styles.error}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="email">
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="johndoe@example.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email
                      ? 'email-error'
                      : undefined
                  }
                />

                {fieldErrors.email && (
                  <p
                    id="email-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label htmlFor="password">
                    Password
                  </label>

                  <Link to="/forgot-password">
                    Forgot password?
                  </Link>
                </div>

                <div
                  className={
                    styles.passwordInputWrap
                  }
                >
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(
                      fieldErrors.password,
                    )}
                    aria-describedby={
                      fieldErrors.password
                        ? 'password-error'
                        : undefined
                    }
                  />

                  <button
                    className={styles.passwordToggle}
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    aria-pressed={showPassword}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeSlash
                        size={18}
                        weight="regular"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        size={18}
                        weight="regular"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>

                {fieldErrors.password && (
                  <p
                    id="password-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                className={styles.submitButton}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Signing in...'
                  : 'Sign in'}
              </button>
            </form>

            <div className={styles.signupPrompt}>
              <span>
                Don't have a Rayern account?
              </span>

              <Link to="/signup">
                Create one
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}