import { Link } from 'react-router-dom'

import styles from './CTA.module.css'

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>
          Ready to get your client
          business under control?
        </h2>

        <p className={styles.subtitle}>
          Create your workspace, add your first
          client, and see what it feels like to have
          everything in one place.
        </p>

        <div className={styles.ctaRow}>
          <Link
            to="/signup"
            className={styles.primaryCta}
          >
            Start using Rayern
          </Link>

          <Link
            to="/login"
            className={styles.secondaryCta}
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  )
}
