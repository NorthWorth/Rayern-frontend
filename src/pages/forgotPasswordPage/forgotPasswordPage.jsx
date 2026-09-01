import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import api from '../../api/apiClient.js'

import styles from '../loginPage/loginPage.module.css'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const [isSubmitted, setIsSubmitted] =
    useState(false)

  const handleChange = (event) => {
    setEmail(event.target.value)

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Email address is required.')
      return
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedEmail,
      )
    ) {
      setError(
        'Please enter a valid email address.',
      )
      return
    }

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post(
        '/auth/forgot-password',
        {
          email: trimmedEmail,
        },
      )

      const result =
        response?.data || response

      setResetUrl(result?.resetUrl || '')

      setIsSubmitted(true)
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Unable to submit your request right now. Please try again.',
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
              Locked out?
              <span>
                {' '}
                We&apos;ll help you back in.
              </span>
            </h1>

            <p>
              Request a password reset and get
              back to managing your clients in
              minutes.
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

            {isSubmitted ? (
              <>
                <div
                  className={
                    styles.formHeader
                  }
                >
                  <span
                    className={styles.eyebrow}
                  >
                    Request received
                  </span>

                  <h2>
                    Check your email
                  </h2>

                  <p>
                    A password reset has been
                    requested for{' '}
                    <strong>{email.trim()}</strong>
                    . If an account exists for
                    this address, password-reset
                    instructions will be sent.
                  </p>

                  {resetUrl && (
                    <p>
                      Email delivery is not
                      configured yet. Use this
                      development reset link to
                      continue:{' '}
                      <a href={resetUrl}>
                        Reset your password
                      </a>
                    </p>
                  )}
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
                    Forgot your password?
                  </h2>

                  <p>
                    Enter the email address on
                    your Rayern account and
                    we&apos;ll start the
                    password-reset process.
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
                      value={email}
                      onChange={handleChange}
                      placeholder="johndoe@example.com"
                      autoComplete="email"
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
                      ? 'Sending...'
                      : 'Send reset link'}
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
