export default function PageSection({ eyebrow, title, action, children, className = '' }) {
  return (
    <section className={`panel page-list-panel ${className}`.trim()}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        {action ? <div className="panel-header-actions">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}
