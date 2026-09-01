import { CalendarBlank } from '@phosphor-icons/react'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import styles from './comingSoonPage.module.css'

export default function ComingSoonPage() {
  return (
    <PageLayout
      title="Meetings"
      subtitle="Coming soon"
    >
      <section className={styles.panel}>
        <span className={styles.icon} aria-hidden="true">
          <CalendarBlank size={26} weight="fill" />
        </span>

        <h2>Meetings are coming soon</h2>

        <p>
          Meeting scheduling is not part of the
          current MVP yet. We are polishing this
          experience and it will arrive in an
          upcoming release.
        </p>
      </section>
    </PageLayout>
  )
}
