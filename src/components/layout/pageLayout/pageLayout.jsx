import Sidebar from '../sidebar/sidebar.jsx'
import NotificationBell from '../notificationBell/notificationBell.jsx'

export default function PageLayout({
  children,
  title,
  subtitle,
  actions,
}) {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="content-area">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">
              {subtitle}
            </p>

            <h1>{title}</h1>
          </div>

          <div className="topbar-actions">
            <NotificationBell />

            {actions}
          </div>
        </header>

        {children}
      </main>
    </div>
  )
}