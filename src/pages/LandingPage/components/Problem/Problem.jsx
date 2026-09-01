import styles from './Problem.module.css'

const scatteredSources = [
  'Email threads',
  'Spreadsheets',
  'Documents',
  'Task tools',
  'Cloud storage',
  'Calendars',
  'Messaging apps',
]

export default function Problem() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 className={styles.title}>
            Client information gets scattered.
            <span className={styles.titleAccent}>
              Rayern gives it one home.
            </span>
          </h2>

          <p className={styles.text}>
            When client details live in seven different
            places, every project starts with a search.
            Context gets lost, follow-ups slip, and the
            overview of your business lives only in your
            head.
          </p>

          <p className={styles.text}>
            Rayern brings the entire client journey —
            from first conversation to final
            deliverable — into one workspace built
            around how client work actually happens.
          </p>
        </div>

        <div
          className={styles.sources}
          aria-label="Places client information usually gets scattered"
        >
          {scatteredSources.map((source) => (
            <span
              key={source}
              className={styles.sourceChip}
            >
              {source}
            </span>
          ))}

          <span
            className={styles.resultLine}
            aria-hidden="true"
          >
            …and nowhere with the client.
          </span>
        </div>
      </div>
    </section>
  )
}
