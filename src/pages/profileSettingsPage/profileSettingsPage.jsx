import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/authContext.jsx'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Toast from '../../components/ui/toast/toast.jsx'
import styles from './profileSettingsPage.module.css'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [isSigningOut, setIsSigningOut] =
    useState(false)

  const [form, setForm] = useState({
    firstName: 'Russell',
    lastName: 'Eshiet',
    email: 'russell@example.com',
    role: 'Frontend Developer',
    phone: '',
    timezone: 'Africa/Lagos',
  })

  const [toast, setToast] = useState('');

  const change = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const saveProfile = (event) => {
    event.preventDefault()
    setToast('Saving profile changes will be available once account updates are connected.')
  }

  const handlePasswordChange = () => {
    setToast('Password management will be connected to authentication later.')
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    await logout()

    navigate('/login', {
      replace: true,
    })
  }

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
                  {form.firstName} {form.lastName}
                </h2>

                <p>{form.email}</p>
              </div>
            </div>

            <div className={styles.accountBadge}>
              <span className={styles.statusDot} />
              Active account
            </div>
          </section>

          <form onSubmit={saveProfile}>

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
                  />
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
                    <option value="Africa/Lagos">
                      Africa/Lagos
                    </option>

                    <option value="Europe/London">
                      Europe/London
                    </option>

                    <option value="America/New_York">
                      America/New_York
                    </option>

                    <option value="America/Los_Angeles">
                      America/Los_Angeles
                    </option>
                  </select>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  className="primary-btn"
                  type="submit"
                >
                  Save changes
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

                  <span>
                    {form.email}
                  </span>
                </div>

                <span className={styles.verifiedBadge}>
                  Verified
                </span>
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
              {isSigningOut
                ? 'Signing out...'
                : 'Sign out'}
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