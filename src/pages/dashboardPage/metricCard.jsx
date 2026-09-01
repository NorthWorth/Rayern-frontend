export default function MetricCard({ label, value, delta }) {
  return (
    <article className="stat-card" aria-label={`${label} metric`}>
      <p className="stat-card__label">{label}</p>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__delta">{delta}</span>
    </article>
  )
}
