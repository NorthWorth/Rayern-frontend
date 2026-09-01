export default function PageTable({ columns, children, className = '' }) {
  return (
    <div className={`table-card ${className}`.trim()}>
      <div className="table-head table-row">
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {children}
    </div>
  )
}
