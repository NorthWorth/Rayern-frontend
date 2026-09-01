import { Link } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import { APP_VERSION, WHATS_NEW } from '../../version.js'
import styles from './settingsPage.module.css'

const settingsSections = [
  {
    title: 'Workspace',
    description: 'Manage your workspace identity and general preferences.',
    items: [
      {
        id: 'workspace',
        title: 'Workspace settings',
        description: 'Workspace name, branding, and general information.',
        icon: '▦',
        to: '/settings/workspace',
      },
      {
        id: 'profile',
        title: 'Profile',
        description: 'Manage your personal information and account details.',
        icon: '◉',
        to: '/settings/profile',
      },
    ],
  },
  {
    title: 'Communication',
    description: 'Control how Rayern keeps you informed.',
    items: [
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Choose which activity and client updates you receive.',
        icon: '◌',
        to: '/settings/notifications',
      },
    ],
  },
  {
    title: 'Billing',
    description: 'Manage your Rayern subscription and payments.',
    items: [
      {
        id: 'billing',
        title: 'Billing & subscription',
        description: 'Manage your plan, payment method, invoices, and usage.',
        icon: '$',
        to: '/settings/billing',
      },
    ],
  },
]

export default function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      subtitle="Workspace preferences"
    >
      <PageSection>
        <div className={styles.page}>
          <section className={styles.intro}>
            <div className={styles.introCopy}>
              <span className={styles.eyebrow}>
                Settings
              </span>

              <h2>
                Configure your Rayern workspace
              </h2>

              <p>
                Manage your workspace, account,
                notifications, and subscription from
                one place.
              </p>
            </div>
          </section>

          <div className={styles.sections}>
            {settingsSections.map((section) => (
              <section
                className={styles.section}
                key={section.title}
              >
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.eyebrow}>
                      {section.title}
                    </span>

                    <h2>{section.title}</h2>

                    <p>
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className={styles.settingsGrid}>
                  {section.items.map((item) => (
                    <Link
                      className={styles.settingsCard}
                      to={item.to}
                      key={item.id}
                    >
                      <div className={styles.cardIcon}>
                        {item.icon}
                      </div>

                      <div className={styles.cardContent}>
                        <h3>{item.title}</h3>

                        <p>
                          {item.description}
                        </p>
                      </div>

                      <span
                        className={styles.arrow}
                        aria-hidden="true"
                      >
                        <CaretRight
                          size={16}
                          weight="bold"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section
            className={styles.section}
            aria-label="What's new in Rayern"
          >
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.eyebrow}>
                  What&apos;s new
                </span>

                <h2>What&apos;s new</h2>

                <p>
                  The latest improvements in
                  Rayern.
                </p>
              </div>

              <span className={styles.versionBadge}>
                v{APP_VERSION}
              </span>
            </div>

            <div className={styles.whatsNewCard}>
              <ul className={styles.whatsNewList}>
                {WHATS_NEW[0].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </PageSection>
    </PageLayout>
  )
}