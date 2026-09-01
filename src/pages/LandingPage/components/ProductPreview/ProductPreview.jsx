import dashboardScreenshot from '../../../../assets/rayern-screenshot.png'

import styles from './ProductPreview.module.css'

const highlights = [
  {
    title: 'One overview',
    text: 'Clients, projects, tasks, and deliverables counted and current the moment you sign in.',
  },
  {
    title: 'Quick actions',
    text: 'Add a client, schedule a meeting, or start a project right from the dashboard.',
  },
  {
    title: 'Nothing buried',
    text: 'Recent activity and upcoming meetings surface themselves — you don’t dig for them.',
  },
]

export default function ProductPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            Inside the workspace
          </span>

          <h2 className={styles.title}>
            A dashboard that knows
            what matters
          </h2>

          <p className={styles.subtitle}>
            This is the real Rayern dashboard — the
            first thing you see when you sit down to
            work on your client business.
          </p>
        </div>

        <div className={styles.frame}>
          <div className={styles.frameBar}>
            <span className={styles.frameDot} />
            <span className={styles.frameDot} />
            <span className={styles.frameDot} />
          </div>

          <img
            src={dashboardScreenshot}
            alt="Rayern dashboard with business overview, quick actions, and workspace metrics"
            className={styles.screenshot}
            width="1348"
            height="676"
            loading="lazy"
          />
        </div>

        <div className={styles.highlights}>
          {highlights.map((highlight) => (
            <div
              key={highlight.title}
              className={styles.highlight}
            >
              <h3 className={styles.highlightTitle}>
                {highlight.title}
              </h3>

              <p className={styles.highlightText}>
                {highlight.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
