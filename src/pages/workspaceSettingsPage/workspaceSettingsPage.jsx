import { useState } from 'react'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Toast from '../../components/ui/toast/toast.jsx'
import styles from './workspaceSettingsPage.module.css'

export default function WorkspaceSettingsPage() {
  const [form, setForm] = useState({
    name: 'Rayern',
    description: 'Client workspace for managing client relationships and projects.',
    slug: 'rayern',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    currency: 'USD',
  })

  const [toast, setToast] = useState('')

  const change = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const saveWorkspace = (event) => {
    event.preventDefault()
    setToast('Saving workspace settings will be available once workspace updates are connected.')
  }

  const handleLogoChange = () => {
    setToast('Logo uploads will be connected later.')
  }

  const handleDeleteWorkspace = () => {
    setToast('Workspace deletion will be available later.')
  }

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
                R
              </div>

              <div className={styles.identityCopy}>
                <span className={styles.eyebrow}>
                  Workspace
                </span>

                <h2>{form.name}</h2>

                <p>
                  {form.description}
                </p>
              </div>
            </div>

            <span className={styles.workspaceStatus}>
              Active
            </span>
          </section>

          <form onSubmit={saveWorkspace}>

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
                  />

                  <span className={styles.helpText}>
                    This name appears throughout your
                    workspace.
                  </span>
                </div>

                <div className={styles.field}>
                  <label htmlFor="slug">
                    Workspace slug
                  </label>

                  <div className={styles.slugInput}>
                    <span>
                      rayern.app/
                    </span>

                    <input
                      id="slug"
                      name="slug"
                      value={form.slug}
                      onChange={change}
                      placeholder="workspace-name"
                    />
                  </div>

                  <span className={styles.helpText}>
                    Used for your workspace's public
                    client-facing links.
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
                >
                  Save changes
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
                    R
                  </div>

                  <div>
                    <strong>
                      {form.name}
                    </strong>

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
                <span>Recommended</span>
                <p>
                  Use a square PNG or SVG logo for the
                  best results across client-facing pages.
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

                <div className={styles.field}>
                  <label htmlFor="dateFormat">
                    Date format
                  </label>

                  <select
                    id="dateFormat"
                    name="dateFormat"
                    value={form.dateFormat}
                    onChange={change}
                  >
                    <option value="DD/MM/YYYY">
                      DD/MM/YYYY
                    </option>

                    <option value="MM/DD/YYYY">
                      MM/DD/YYYY
                    </option>

                    <option value="YYYY-MM-DD">
                      YYYY-MM-DD
                    </option>
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
                  >
                    <option value="USD">
                      USD — US Dollar
                    </option>

                    <option value="NGN">
                      NGN — Nigerian Naira
                    </option>

                    <option value="GBP">
                      GBP — British Pound
                    </option>

                    <option value="EUR">
                      EUR — Euro
                    </option>
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
                >
                  Save preferences
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