import styles from './badge.module.css'

const toneMap = {
  active: styles.active,
  lead: styles.lead,
  inactive: styles.inactive,
  archived: styles.archived,
  atRisk: styles.atRisk,
  prospect: styles.prospect,
}

export default function Badge({ children, tone = 'active' }) {
  return <span className={`${styles.badge} ${toneMap[tone] ?? styles.active}`.trim()}>{children}</span>
}
