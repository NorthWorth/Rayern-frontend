import { useState, useRef } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Eye, EyeSlash, Check } from '@phosphor-icons/react'

import { useAuth } from '../../context/authContext.jsx'

import styles from './signupPage.module.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { signup } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
  })

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const prevFormRef = useRef(form)

  const togglePasswordVisibility = (name) => {
    setShowPassword((current) => ({
      ...current,
      [name]: !current[name],
    }))
  }

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

    setFieldErrors((current) => {
      const next = { ...current, [name]: '' }

      if (pw && cpw) {
        if (pw !== cpw) {
          next.confirmPassword =
            'Passwords do not match.'
        } else {
          delete next.confirmPassword
        }
      } else {
        delete next.confirmPassword
      }

      return next
    })

    if (error) {
      setError('')
    }

    prevFormRef.current = {
      ...prev,
      [name]: value,
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setFieldErrors({})

    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const email = form.email.trim()
    const workspaceName =
      form.workspaceName.trim()

    const localErrors = {}

    if (!firstName) {
      localErrors.firstName =
        'First name is required.'
    }

    if (!lastName) {
      localErrors.lastName =
        'Last name is required.'
    }

    if (!email) {
      localErrors.email =
        'Email address is required.'
    }

    if (!workspaceName) {
      localErrors.workspaceName =
        'Workspace name is required.'
    }

    if (!form.password) {
      localErrors.password =
        'Password is required.'
    } else if (form.password.length < 8) {
      localErrors.password =
        'Password must be at least 8 characters.'
    }

    if (!form.confirmPassword) {
      localErrors.confirmPassword =
        'Please confirm your password.'
    } else if (
      form.password !== form.confirmPassword
    ) {
      localErrors.confirmPassword =
        'Passwords do not match.'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await signup({
        firstName,
        lastName,
        email,
        password: form.password,
        workspaceName,
      })

      const destination =
        location.state?.from || '/dashboard'

      navigate(destination, {
        replace: true,
      })
    } catch (signupError) {
      if (signupError?.fields) {
        setFieldErrors(signupError.fields)
      }

      setError(
        signupError?.fields &&
          Object.keys(signupError.fields).length
          ? ''
          : signupError?.message ||
              'Unable to create your account. Please try again.',
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
              <strong>RATERN</strong>
              <span>Client workspace</span>
            </div>
          </div>

          <div className={styles.brandContent}>
            <span className={styles.eyebrow}>
              Start managing better
            </span>

            <h1>
              Build stronger client
              <span> relationships.</span>
            </h1>

            <p>
              Bring your clients, projects, tasks,
              deliverables, documents, and follow-ups
              together in one organized workspace.
            </p>

            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <Check
                  size={13}
                  weight="bold"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    One client workspace
                  </strong>

                  <p>
                    Keep everything related to a client
                    in one place.
                  </p>
                </div>
              </div>

              <div className={styles.benefit}>
                <Check
                  size={13}
                  weight="bold"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Stay on top of delivery
                  </strong>

                  <p>
                    Track projects, tasks, meetings,
                    and deliverables.
                  </p>
                </div>
              </div>

              <div className={styles.benefit}>
                <Check
                  size={13}
                  weight="bold"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Keep clients informed
                  </strong>

                  <p>
                    Make reviews and client updates
                    easier to manage.
                  </p>
                </div>
              </div>
            </div>
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

            <div className={styles.formHeader}>
              <span className={styles.eyebrow}>
                Create your workspace
              </span>

              <h2>Create your account</h2>

              <p>
                Start organizing your client work
                with Rayern.
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

              <div className={styles.nameGrid}>
                <div className={styles.field}>
                  <label htmlFor="firstName">
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    autoComplete="given-name"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(
                      fieldErrors.firstName,
                    )}
                  />

                  {fieldErrors.firstName && (
                    <p
                      className={styles.fieldError}
                      role="alert"
                    >
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="lastName">
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    autoComplete="family-name"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(
                      fieldErrors.lastName,
                    )}
                  />

                  {fieldErrors.lastName && (
                    <p
                      className={styles.fieldError}
                      role="alert"
                    >
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="workspaceName">
                  Workspace name
                </label>

                <input
                  id="workspaceName"
                  name="workspaceName"
                  type="text"
                  value={form.workspaceName}
                  onChange={handleChange}
                  placeholder="Your business or workspace"
                  autoComplete="organization"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(
                    fieldErrors.workspaceName,
                  )}
                />

                {fieldErrors.workspaceName && (
                  <p
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.workspaceName}
                  </p>
                )}
              </div>

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
                  aria-invalid={Boolean(
                    fieldErrors.email,
                  )}
                />

                {fieldErrors.email && (
                  <p
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="password">
                  Password
                </label>

                <div
                  className={
                    styles.passwordInputWrap
                  }
                >
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword.password
                        ? 'text'
                        : 'password'
                    }
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    minLength={8}
                    aria-invalid={Boolean(
                      fieldErrors.password,
                    )}
                  />

                  <PasswordToggleButton
                    isVisible={showPassword.password}
                    onToggle={() =>
                      togglePasswordVisibility(
                        'password',
                      )
                    }
                    disabled={isSubmitting}
                  />
                </div>

                {fieldErrors.password && (
                  <p
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div
                  className={
                    styles.passwordInputWrap
                  }
                >
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showPassword.confirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    minLength={8}
                    aria-invalid={Boolean(
                      fieldErrors.confirmPassword,
                    )}
                  />

                  <PasswordToggleButton
                    isVisible={
                      showPassword.confirmPassword
                    }
                    onToggle={() =>
                      togglePasswordVisibility(
                        'confirmPassword',
                      )
                    }
                    disabled={isSubmitting}
                  />
                </div>

                {fieldErrors.confirmPassword && (
                  <p
                    className={styles.fieldError}
                    role="alert"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                className={styles.submitButton}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Creating account...'
                  : 'Create account'}
              </button>
            </form>

            <div className={styles.loginPrompt}>
              <span>
                Already have a Rayern account?
              </span>

              <Link to="/login">
                Sign in
              </Link>
            </div>

            <p className={styles.legal}>
              By creating an account, you agree to
              Rayern's terms and privacy policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function PasswordToggleButton({
  isVisible,
  onToggle,
  disabled,
}) {
  return (
    <button
      className={styles.passwordToggle}
      type="button"
      onClick={onToggle}
      aria-label={
        isVisible ? 'Hide password' : 'Show password'
      }
      aria-pressed={isVisible}
      disabled={disabled}
    >
      {isVisible ? (
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
  )
}