import { useEffect, useState } from 'react'

import { useAuth } from '../../context/authContext.jsx'
import api from '../../api/apiClient.js'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Toast from '../../components/ui/toast/toast.jsx'
import styles from './workspaceSettingsPage.module.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  slug: '',
  timezone: 'Africa/Lagos',
  dateFormat: 'DD/MM/YYYY',
  currency: 'USD',
}

const SUPPORTED_TIMEZONES = [
  'Africa/Lagos',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
]

const SLUG_HELP_TEXT =
  'Slug editing is not available yet. Your workspace slug is set up with your workspace.'

export default function WorkspaceSettingsPage() {
  const { workspace } = useAuth()

  const [isSaving, setIsSaving] = useState(false)
  const [serverWorkspace, setServerWorkspace] = useState(null)
  const [toast, setToast] = useState('')

  const initialWorkspace =
    workspace && workspace.id ? workspace : null

  const [form, setForm] = useState(() => {
    if (!initialWorkspace) {
      return { ...EMPTY_FORM }
    }

    return {
      ...EMPTY_FORM,
      name:
        serverWorkspace?.name ??
        initialWorkspace.name ??
        '',
      description:
        serverWorkspace?.description ??
        initialWorkspace.description ??
        '',
      slug: initialWorkspace.name
        ? String(initialWorkspace.name)
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'workspace'
        : '',
      timezone:
        serverWorkspace?.timezone ??
        initialWorkspace.timezone ??
        'Africa/Lagos',
      dateFormat:
        serverWorkspace?.dateFormat ??
        initialWorkspace.dateFormat ??
        'DD/MM/YYYY',
      currency:
        serverWorkspace?.currency ??
        initialWorkspace.currency ??
        'USD',
    }
  })

  useEffect(() => {
    if (!initialWorkspace) {
      return
    }

    let active = true

    api
      .patch('/workspace')
      .then((response) => {
        if (!active) {
          return
        }

        const next = response?.data?.workspace

        if (!next) {
          throw new Error('Invalid workspace response.')
        }

        setServerWorkspace(next)

        setForm((current) => ({
          ...current,
          name: next.name ?? current.name,
          description: next.description ?? current.description,
          timezone:
            next.timezone ?? current.timezone,
          dateFormat:
            next.dateFormat ?? current.dateFormat,
          currency: next.currency ?? current.currency,
        }))
      })
      .catch(() => {
        if (!active) {
          return
        }

        setServerWorkspace(null)
      })

    return () => {
      active = false
    }
  }, [initialWorkspace])

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
      const response = await api.patch('/workspace', {
        name: form.name.trim(),
        description: form.description.trim(),
        timezone: form.timezone,
        dateFormat: form.dateFormat,
        currency: form.currency,
      })

      const updated = response?.data?.workspace

      if (!updated) {
        throw new Error('Invalid workspace response.')
      }

      setServerWorkspace(updated)

      setForm((current) => ({
        ...current,
        name: updated.name ?? current.name,
        description:
          updated.description ?? current.description,
        timezone: updated.timezone ?? current.timezone,
        dateFormat: updated.dateFormat ?? current.dateFormat,
        currency: updated.currency ?? current.currency,
      }))

      setToast('Workspace settings saved.')
    } catch (requestError) {
      setToast(
        requestError?.message ||
          'Unable to save workspace settings.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoChange = () => {
    setToast('Logo uploads are not available yet.')
  }

  const handleDeleteWorkspace = () => {
    setToast('Workspace deletion is not available yet.')
  }

  const isLoading =
    !serverWorkspace && initialWorkspace && !isSaving

  const workspaceName =
    serverWorkspace?.name ?? form.name ?? '—'

  const workspaceDescription =
    serverWorkspace?.description ??
    form.description ??
    null

  return (
    <PageLayout
      title="Workspace settings"
      subtitle="Manage your workspace"
    >
      <PageSection>
        <div className={styles.page}>
          <section className={styles.workspaceHero}>
            <div className={styles.workspaceIdentity}>
              <div
                className={styles.workspaceLogo}
                aria-hidden="true"
              >
                {workspaceName?.[0]?.toUpperCase() ?? 'W'}
              </div>

              <div className={styles.identityCopy}>
                <span className={styles.eyebrow}>
                  Workspace
                </span>

                <h2>{workspaceName}</h2>

                {workspaceDescription ? (
                  <p>{workspaceDescription}</p>
                ) : (
                  <p className={styles.emptyDescription}>
                    No description yet.
                  </p>
                )}
              </div>
            </div>

            {isLoading ? (
              <span className={styles.workspaceStatus}>
                Loading
              </span>
            ) : (
              <span className={styles.workspaceStatus}>
                Active
              </span>
            )}
          </section>

          <form onSubmit={handleSave}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    Workspace identity
                  </span>

                  <h2>General information</h2>

                  <p>
                    Configure the basic information your
                    workspace uses across Rayern.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="name">
                    Workspace name
                  </label>

                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={change}
                    placeholder="Your workspace name"
                    required
                  />

                  <span className={styles.helpText}>
                    This name appears throughout your
                    workspace.
                  </span>
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="description">
                    Workspace description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={change}
                    rows={4}
                    placeholder="Describe your workspace"
                  />

                  <span className={styles.helpText}>
                    A short description of what your
                    workspace is used for.
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

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    Workspace branding
                  </span>

                  <h2>Appearance</h2>

                  <p>
                    Control how your workspace identity
                    appears to clients.
                  </p>
                </div>
              </div>

              <div className={styles.brandingCard}>
                <div className={styles.brandPreview}>
                  <div
                    className={styles.previewLogo}
                    aria-hidden="true"
                  >
                    {workspaceName?.[0]?.toUpperCase() ?? 'W'}
                  </div>

                  <div>
                    <strong>{workspaceName}</strong>

                    <span>
                      Client workspace
                    </span>
                  </div>
                </div>

                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handleLogoChange}
                >
                  Change logo
                </button>
              </div>

              <div className={styles.brandNote}>
                <span>Coming soon</span>
                <p>
                  Logo uploads will be available in a
                  future update.
                </p>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    Regional preferences
                  </span>

                  <h2>Defaults</h2>

                  <p>
                    Choose the defaults Rayern uses
                    when displaying dates and financial
                    information.
                  </p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="timezone">
                    Timezone
                  </label>

                  <select
                    id="timezone"
                    name="timezone"
                    value={form.timezone}
                    onChange={change}
                    required
                  >
                    {SUPPORTED_TIMEZONES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="dateFormat">
                    Date format
                  </label>

                  <select
                    id="dateFormat"
                    name="dateFormat"
                    value={form.dateFormat}
                    onChange={change}
                    required
                  >
                    {DATE_FORMATS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="currency">
                    Currency
                  </label>

                  <select
                    id="currency"
                    name="currency"
                    value={form.currency}
                    onChange={change}
                    required
                  >
                    {CURRENCIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <span className={styles.helpText}>
                    Used for invoices and financial
                    information inside the workspace.
                  </span>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save preferences'}
                </button>
              </div>
            </section>
          </form>

          <section className={styles.clientExperience}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Client experience
                </span>

                <h2>Client-facing workspace</h2>

                <p>
                  These preferences will eventually
                  control what clients see when interacting
                  with your workspace.
                </p>
              </div>
            </div>

            <div className={styles.preferenceList}>
              <div className={styles.preferenceItem}>
                <div>
                  <strong>
                    Show workspace branding
                  </strong>

                  <span>
                    Display your workspace name and logo
                    on client-facing pages.
                  </span>
                </div>

                <span className={styles.enabledBadge}>
                  Enabled
                </span>
              </div>

              <div className={styles.preferenceItem}>
                <div>
                  <strong>
                    Client portal
                  </strong>

                  <span>
                    Give clients a dedicated place to
                    access shared work and deliverables.
                  </span>
                </div>

                <span className={styles.comingSoonBadge}>
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          <section className={styles.dangerZone}>
            <div>
              <span className={styles.eyebrow}>
                Danger zone
              </span>

              <h2>Delete workspace</h2>

              <p>
                Permanently delete this workspace and
                all of its data. This action cannot be
                undone.
              </p>
            </div>

            <button
              className={styles.dangerButton}
              type="button"
              onClick={handleDeleteWorkspace}
            >
              Delete workspace
            </button>
          </section>
        </div>
      </PageSection>

      <Toast
        title="Workspace"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}
