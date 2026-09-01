import {
  Users,
  Handshake,
  Kanban,
  CheckSquare,
  Package,
  CalendarBlank,
  Files,
  Bell,
} from '@phosphor-icons/react'

import styles from './Features.module.css'

const features = [
  {
    Icon: Users,
    title: 'Clients',
    text: 'Keep every client’s details, projects, and history together in one clear profile.',
  },
  {
    Icon: Handshake,
    title: 'Leads',
    text: 'Track prospective clients, and convert them into clients when they’re ready.',
  },
  {
    Icon: Kanban,
    title: 'Projects',
    text: 'Run each engagement with a clear owner, status, and progress from kickoff to delivery.',
  },
  {
    Icon: CheckSquare,
    title: 'Tasks',
    text: 'Turn project work into an organized task list so nothing gets lost along the way.',
  },
  {
    Icon: Package,
    title: 'Deliverables',
    text: 'Move work through review and approval before it ever reaches your client.',
  },
  {
    Icon: CalendarBlank,
    title: 'Meetings',
    text: 'Schedule client meetings and keep them connected to the work they belong to.',
  },
  {
    Icon: Files,
    title: 'Documents',
    text: 'Store client files right where the rest of the relationship already lives.',
  },
  {
    Icon: Bell,
    title: 'Notifications',
    text: 'Hear about updates across your workspace without chasing anyone for them.',
  },
]

export default function Features() {
  return (
    <section
      className={styles.section}
      id="features"
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            Everything in one workspace
          </span>

          <h2 className={styles.title}>
            Built around the whole
            client journey
          </h2>

          <p className={styles.subtitle}>
            Each part of Rayern maps to a real part of
            running a client business — no tab-hopping,
            no duplicate records.
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature) => {
            const { Icon } = feature

            return (
              <article
                key={feature.title}
                className={styles.card}
              >
                <span className={styles.iconWrap}>
                  <Icon
                    size={22}
                    weight="duotone"
                    aria-hidden="true"
                  />
                </span>

                <h3 className={styles.cardTitle}>
                  {feature.title}
                </h3>

                <p className={styles.cardText}>
                  {feature.text}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
