import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import styles from './notificationSettingsPage.module.css'

const DEFAULT_PREFERENCES = {
  taskUpdates: true,
  projectUpdates: true,
  clientActivity: true,
  paymentReminders: true,
  meetingReminders: true,
  workspaceNotifications: true,
  inApp: true,
  email: false,
}

const CATEGORY_SECTIONS = [
  {
    eyebrow: 'Delivery',
    title: 'Delivery channels',
    description:
      'Choose how Rayern reaches you when something needs your attention.',
    items: [
      {
        name: 'inApp',
        label: 'In-app notifications',
        description:
          'Show notifications inside the Rayern workspace.',
      },
      {
        name: 'email',
        label: 'Email notifications',
        description:
          'Send notification summaries to your account email.',
      },
    ],
  },
  {
    eyebrow: 'Workspace activity',
    title: 'What to notify me about',
    description:
      'Select the client work that should trigger notifications.',
    items: [
      {
        name: 'taskUpdates',
        label: 'Task updates',
        description:
          'Task status changes, completions, and due-date reminders.',
      },
      {
        name: 'projectUpdates',
        label: 'Project updates',
        description:
          'Project status changes and progress milestones.',
      },
      {
        name: 'clientActivity',
        label: 'Client activity',
        description:
          'New clients, profile changes, and review feedback.',
      },
      {
        name: 'paymentReminders',
        label: 'Payment reminders',
        description:
          'Follow-ups for outstanding invoices and payments.',
      },
      {
        name: 'meetingReminders',
        label: 'Meeting reminders',
        description:
          'Upcoming client meetings and schedule changes.',
      },
      {
        name: 'workspaceNotifications',
        label: 'General workspace notifications',
        description:
          'Other important updates about your workspace.',
      },
    ],
  },
]

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] =
    useState(DEFAULT_PREFERENCES)

  const [toast, setToast] = useState('')

  const change = (event) => {
    const { name, checked } = event.target

    setPreferences((current) => ({
      ...current,
      [name]: checked,
    }))
  }

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
    setToast('Notification settings reset to defaults')
  }

  const savePreferences = (event) => {
    event.preventDefault()
    setToast('Notification preferences saved')
  }

  return (
    <PageLayout
      title="Notification Settings"
      subtitle="Stay informed"
    >
      <PageSection>
        <div className={styles.page}>
          <Link
            to="/settings"
            className={styles.backButton}
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            Back to settings
          </Link>

          <form onSubmit={savePreferences}>
            {CATEGORY_SECTIONS.map(
              (section) => (
                <section
                  className={styles.section}
                  key={section.title}
                >
                  <div
                    className={
                      styles.sectionHeader
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.eyebrow
                        }
                      >
                        {section.eyebrow}
                      </span>

                      <h2>
                        {section.title}
                      </h2>

                      <p>
                        {
                          section.description
                        }
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.preferencesList
                    }
                  >
                    {section.items.map(
                      (item) => (
                        <label
                          className={
                            styles.preferenceRow
                          }
                          key={item.name}
                          htmlFor={`preference-${item.name}`}
                        >
                          <div
                            className={
                              styles.preferenceCopy
                            }
                          >
                            <strong>
                              {item.label}
                            </strong>

                            <span>
                              {
                                item.description
                              }
                            </span>
                          </div>

                          <input
                            id={`preference-${item.name}`}
                            type="checkbox"
                            name={item.name}
                            checked={
                              preferences[
                                item.name
                              ]
                            }
                            onChange={change}
                            className={
                              styles.toggleInput
                            }
                          />

                          <span
                            className={
                              styles.toggle
                            }
                            aria-hidden="true"
                          />
                        </label>
                      ),
                    )}
                  </div>
                </section>
              ),
            )}

            <section
              className={styles.section}
            >
              <p
                className={styles.localHint}
              >
                Preferences are stored in this
                browser session until
                notification delivery is
                connected.
              </p>

              <div
                className={
                  styles.formActions
                }
              >
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={resetToDefaults}
                >
                  Reset to defaults
                </button>

                <button
                  className="primary-btn"
                  type="submit"
                >
                  Save Changes
                </button>
              </div>
            </section>
          </form>
        </div>
      </PageSection>

      <Toast
        title="Notifications"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}
