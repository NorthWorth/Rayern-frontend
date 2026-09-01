import styles from './HowItWorks.module.css'

const steps = [
  {
    number: '01',
    title: 'Add your client',
    text: 'Create a client profile in seconds. It becomes the single home for everything that follows — projects, files, meetings, and history.',
  },
  {
    number: '02',
    title: 'Organize the work',
    text: 'Set up projects, break them into tasks, track deliverables through review, and attach the documents and meetings that belong to them.',
  },
  {
    number: '03',
    title: 'Stay on top of it',
    text: 'Your dashboard shows what’s active, what’s waiting for review, and what’s coming up — so follow-ups happen before clients have to ask.',
  },
]

export default function HowItWorks() {
  return (
    <section
      className={styles.section}
      id="how-it-works"
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            How it works
          </span>

          <h2 className={styles.title}>
            From first contact to
            final delivery
          </h2>
        </div>

        <ol className={styles.steps}>
          {steps.map((step) => (
            <li
              key={step.number}
              className={styles.step}
            >
              <span className={styles.stepNumber}>
                {step.number}
              </span>

              <h3 className={styles.stepTitle}>
                {step.title}
              </h3>

              <p className={styles.stepText}>
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
