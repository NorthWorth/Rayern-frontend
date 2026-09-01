import { Check } from '@phosphor-icons/react'

import styles from './Benefits.module.css'

const benefits = [
  {
    title: 'Less scattered information',
    text: 'Client context stops living in inboxes and spreadsheets. It lives with the client.',
  },
  {
    title: 'Fewer missed follow-ups',
    text: 'Tasks, reviews, and upcoming meetings are visible before they become awkward conversations.',
  },
  {
    title: 'Clearer client relationships',
    text: 'Open a client and see the full picture — active work, recent files, past meetings — at a glance.',
  },
  {
    title: 'Better visibility across active work',
    text: 'One dashboard tells you what’s moving, what’s stuck, and what needs your attention today.',
  },
  {
    title: 'Easier to grow',
    text: 'The same calm workspace whether you manage five clients or fifty — without adding more tools.',
  },
]

export default function Benefits() {
  return (
    <section
      className={styles.section}
      id="benefits"
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            Why Rayern
          </span>

          <h2 className={styles.title}>
            What changes when your
            client business is organized
          </h2>
        </div>

        <ul className={styles.list}>
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className={styles.item}
            >
              <span
                className={styles.check}
                aria-hidden="true"
              >
                <Check
                  size={14}
                  weight="bold"
                />
              </span>

              <div>
                <h3 className={styles.itemTitle}>
                  {benefit.title}
                </h3>

                <p className={styles.itemText}>
                  {benefit.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
