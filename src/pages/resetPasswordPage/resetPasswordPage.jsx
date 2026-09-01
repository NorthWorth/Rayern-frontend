import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import api from '../../api/apiClient.js'

import styles from '../loginPage/loginPage.module.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()

  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const [isReset, setIsReset] = useState(false)

  const prevFormRef = useRef(form)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    const prev = prevFormRef.current

    const pw =
      name === 'password'
        ? value
        : prev.password
    const cpw =
      name === 'confirmPassword'
        ? value
        : prev.confirmPassword

    if (pw && cpw && pw !== cpw) {
      setError('Passwords do not match.')
    } else if (
      error === 'Passwords do not match.'
    ) {
      setError('')
    }

    prevFormRef.current = {
      ...prev,
      [name]: value,
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!token) {
      setError(
        'This password reset link is invalid. Please request a new one.',
      )
      return
    }

    if (!form.password) {
      setError('Password is required.')
      return
    }

    if (form.password.length < 8) {
      setError(
        'Password must be at least 8 characters.',
      )
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      await api.post('/auth/reset-password', {
        token,
        password: form.password,
      })

      setIsReset(true)
    } catch (resetError) {
      setError(
        resetError?.message ||
          'Unable to reset your password right now. Please try again.',
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
              <strong>Rayern</strong>
              <span>Client workspace</span>
            </div>
          </div>

          <div className={styles.brandContent}>
            <span className={styles.eyebrow}>
              Account recovery
            </span>

            <h1>
              Choose a new password
              <span> and get back to work.</span>
            </h1>

            <p>
              Pick a strong password you have not
              used on Rayern before and regain
              access to your workspace.
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
                <strong>Rayern</strong>
                <span>Client workspace</span>
              </div>
            </div>

            {isReset ? (
              <>
                <div
                  className={
                    styles.formHeader
                  }
                >
                  <span
                    className={styles.eyebrow}
                  >
                    Password updated
                  </span>

                  <h2>
                    All set
                  </h2>

                  <p>
                    Your password has been changed.
                    Sign in with your new password
                    to continue.
                  </p>
                </div>

                <button
                  className={styles.submitButton}
                  type="button"
                  onClick={() =>
                    navigate('/login', {
                      replace: true,
                    })
                  }
                >
                  <ArrowLeft size={15} weight="bold" aria-hidden="true" />
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                <div
                  className={
                    styles.formHeader
                  }
                >
                  <span
                    className={styles.eyebrow}
                  >
                    Password reset
                  </span>

                  <h2>
                    Set a new password
                  </h2>

                  <p>
                    Enter a new password for your
                    Rayern account.
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
                    <label htmlFor="password">
                      New password
                    </label>

                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="confirmPassword">
                      Confirm new password
                    </label>

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <button
                    className={
                      styles.submitButton
                    }
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Updating...'
                      : 'Reset password'}
                  </button>
                </form>
              </>
            )}

            <div className={styles.signupPrompt}>
              <span>
                Remembered your password?
              </span>

              <Link to="/login">
                <ArrowLeft size={15} weight="bold" aria-hidden="true" />
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
