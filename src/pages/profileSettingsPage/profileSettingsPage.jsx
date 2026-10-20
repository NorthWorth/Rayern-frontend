import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/authContext.jsx'
import api from '../../api/apiClient.js'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Toast from '../../components/ui/toast/toast.jsx'
import styles from './profileSettingsPage.module.css'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  timezone: 'Africa/Lagos',
}

const SUPPORTED_TIMEZONES = [
  'Africa/Lagos',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
]

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(user
      ? {
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email ?? '',
        }
      : {}),
  }))

  const [serverUser, setServerUser] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!user) {
      return
    }

    let active = true

    api
      .get('/auth/me')
      .then((response) => {
        if (!active) {
          return
        }

        const profile = response?.data?.user

        if (!profile) {
          throw new Error('Invalid session response.')
        }

        setServerUser(profile)
        setForm((current) => ({
          ...current,
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
        }))
      })
      .catch(() => {
        if (!active) {
          return
        }

        setServerUser(null)
        setForm((current) => ({
          ...current,
          firstName: '',
          lastName: '',
          email: '',
        }))
      })

    return () => {
      active = false
    }
  }, [user])

  const change = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setIsSaving(true)
    setToast('')

    try {
      const response = await api.patch('/profile', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      })

      const updated = response?.data?.user

      if (!updated) {
        throw new Error('Invalid profile response.')
      }

      setServerUser(updated)
      setForm((current) => ({
        ...current,
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
      }))

      setToast('Profile changes saved.')
    } catch (requestError) {
      setToast(
        requestError?.message || 'Unable to save profile changes.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = () => {
    setToast(
      'Password changes are managed separately. Use Sign out and sign in again if you need a different account.'
    )
  }

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)

    await logout()

    navigate('/login', {
      replace: true,
    })
  }

  const isLoading =
    !serverUser && user && !isSaving && !isSigningOut

  const verified = serverUser?.emailVerified === true

  return (
    <PageLayout
      title="Profile"
      subtitle="Account settings"
    >
      <PageSection>
        <div className={styles.page}>
          <section className={styles.profileHero}>
            <div className={styles.identity}>
              <Avatar
                name={`${form.firstName} ${form.lastName}`}
                size="lg"
                color="indigo"
              />

              <div className={styles.identityCopy}>
                <span className={styles.eyebrow}>
                  Your account
                </span>

                <h2>
                  {form.firstName || '—'} {form.lastName || ''}
                </h2>

                <p>{form.email || '—'}</p>
              </div>
            </div>

            {isLoading ? (
              <div className={styles.accountBadgeLoading}>
                <span className={styles.statusDotPulse} />
                Loading
              </div>
            ) : verified ? (
              <div className={styles.accountBadge}>
                <span className={styles.statusDot} />
                Email verified
              </div>
            ) : (
              <div className={styles.accountBadgeUnverified}>
                <span className={styles.statusDotMuted} />
                Email not verified
              </div>
            )}
          </section>

          <form onSubmit={handleSave}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    Personal information
                  </span>

                  <h2>Profile details</h2>

                  <p>
                    Update the information associated with
                    your Rayern account.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="firstName">
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    onChange={change}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="lastName">
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    onChange={change}
                    placeholder="Last name"
                    required
                  />
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
                    onChange={change}
                    placeholder="you@example.com"
                    disabled
                  />

                  <span className={styles.helpText}>
                    Email is managed separately. Change it
                    from the account security section.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="phone">
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={change}
                    placeholder="Optional"
                  />

                  <span className={styles.helpText}>
                    Saved locally for now.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="role">
                    Role
                  </label>

                  <input
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={change}
                    placeholder="Your role"
                  />

                  <span className={styles.helpText}>
                    Saved locally for now.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="timezone">
                    Timezone
                  </label>

                  <select
                    id="timezone"
                    name="timezone"
                    value={form.timezone}
                    onChange={change}
                  >
                    {SUPPORTED_TIMEZONES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <span className={styles.helpText}>
                    Saved locally for now.
                  </span>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </section>
          </form>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Security
                </span>

                <h2>Account security</h2>

                <p>
                  Manage how you access your Rayern
                  account.
                </p>
              </div>
            </div>

            <div className={styles.securityList}>
              <div className={styles.securityItem}>
                <div>
                  <strong>Password</strong>

                  <span>
                    Change your account password.
                  </span>
                </div>

                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handlePasswordChange}
                >
                  Change password
                </button>
              </div>

              <div className={styles.securityItem}>
                <div>
                  <strong>Email address</strong>

                  <span>{form.email || '—'}</span>
                </div>

                {verified ? (
                  <span className={styles.verifiedBadge}>
                    Verified
                  </span>
                ) : (
                  <span className={styles.unverifiedBadge}>
                    Not verified
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Sessions
                </span>

                <h2>Active sessions</h2>

                <p>
                  Devices currently signed into your
                  account.
                </p>
              </div>
            </div>

            <div className={styles.sessionCard}>
              <div className={styles.sessionIcon}>
                💻
              </div>

              <div className={styles.sessionInfo}>
                <strong>
                  Current browser session
                </strong>

                <span>
                  Windows · Chrome
                </span>

                <small>
                  Active now
                </small>
              </div>

              <span className={styles.currentSession}>
                Current
              </span>
            </div>
          </section>

          <section className={styles.dangerZone}>
            <div>
              <span className={styles.eyebrow}>
                Danger zone
              </span>

              <h2>Account actions</h2>

              <p>
                Signing out will end your current
                Rayern session.
              </p>
            </div>

            <button
              className={styles.dangerButton}
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </section>
        </div>
      </PageSection>

      <Toast
        title="Profile"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}
