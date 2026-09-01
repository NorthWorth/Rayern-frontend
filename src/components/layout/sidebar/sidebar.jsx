import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  House,
  Users,
  Handshake,
  Kanban,
  CheckSquare,
  Files,
  Package,
  ChatCircleText,
  Gear,
  List,
  X,
  SignOut,
} from '@phosphor-icons/react'

import logo from '/rayern-favicons.webp'

import { useAuth } from '../../../context/authContext.jsx'
import FeedbackModal from '../../feedbackModal/feedbackModal.jsx'

const items = [
  { to: '/dashboard', label: 'Dashboard', Icon: House },
  { to: '/clients', label: 'Clients', Icon: Users },
  { to: '/leads', label: 'Leads', Icon: Handshake },
  { to: '/projects', label: 'Projects', Icon: Kanban },
  { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
  { to: '/documents', label: 'Documents', Icon: Files },
  { to: '/deliverables', label: 'Deliverables', Icon: Package },
  { to: '/settings', label: 'Settings', Icon: Gear },
]

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const navigate = useNavigate()

  const { logout } = useAuth()

  const closeSidebar = () => setIsOpen(false)

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    closeSidebar()

    await logout()

    navigate('/login', { replace: true })
  }

  return (
    <div className="sidebar-shell">
      <button
        className="sidebar-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        {isOpen ? <X weight="bold" /> : <List weight="bold" />}
      </button>

      <button className={`sidebar-overlay ${isOpen ? 'is-visible' : ''}`} type="button" aria-label="Close navigation" onClick={closeSidebar} />

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Workspace navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <img src={logo} alt="Rayern Logo" className='rayern-logo' />
          </div>
          <div>
            <h2>RAYERN</h2>
            <p className="eyebrow">Client Workspace</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {items.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'active' : '')}
              end={to === '/dashboard'}
              onClick={closeSidebar}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="sidebar-nav-icon"
                    weight={isActive ? 'bold' : 'regular'}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            className="sidebar-nav-link"
            onClick={() => {
              closeSidebar()
              setIsFeedbackOpen(true)
            }}
          >
            <ChatCircleText className="sidebar-nav-icon" weight="regular" />
            Feedback
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-signout"
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <SignOut className="sidebar-nav-icon" />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      <FeedbackModal
        open={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  )
}
