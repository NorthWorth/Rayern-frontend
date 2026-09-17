import styles from './AboutRayern.module.css'

export default function AboutRayern() {
  return (
    <section
      className={styles.section}
      aria-labelledby="about-rayern-title"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>A clearer way to run client work</span>

          <h2
            id="about-rayern-title"
            className={styles.title}
          >
            What is Rayern?
          </h2>

          <p className={styles.answer}>
            Rayern is a client-management workspace for freelancers, agencies,
            consultants, and other client-facing businesses. It brings the
            client journey into one place, from leads and client records through
            projects, tasks, meetings, documents, deliverables, and follow-ups.
          </p>

          <p className={styles.answer}>
            Rayern is built to organize client relationships and the work behind
            them. It is not a messaging app; it gives your team a reliable home
            for context, progress, files, and next steps alongside the tools you
            already use to communicate.
          </p>
        </div>

        <ul className={styles.list}>
          <li>Manage leads and client relationships</li>
          <li>Organize projects, tasks, and deliverables</li>
          <li>Keep meetings, documents, and follow-ups connected</li>
        </ul>
      </div>
    </section>
  )
}