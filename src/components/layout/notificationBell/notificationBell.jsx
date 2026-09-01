import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCircle,
  CheckSquare,
  UserPlus,
  ArrowUpRight,
  SealCheck,
  Chats,
} from '@phosphor-icons/react'

import { useNotifications } from '../../../context/notificationContext.jsx'

import styles from './notificationBell.module.css'

const typeIcons = {
  deliverable: SealCheck,
  feedback: Chats,
  task: CheckSquare,
  project: ArrowUpRight,
  client: UserPlus,
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef(null)

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const recentNotifications = notifications.slice(0, 5)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  const handleNotificationClick = (id) => {
    markAsRead(id)
    setIsOpen(false)
  }

  return (
    <div
      className={styles.wrapper}
      ref={containerRef}
    >
      <button
        className={styles.bellButton}
        type="button"
        aria-label={`Notifications${
          unreadCount
            ? `, ${unreadCount} unread`
            : ''
        }`}
        aria-expanded={isOpen}
        onClick={() =>
          setIsOpen((current) => !current)
        }
      >
        <Bell
          className={styles.bellIcon}
          size={20}
          weight="regular"
          aria-hidden="true"
        />

        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={styles.dropdown}
          role="dialog"
          aria-label="Notifications"
        >
          <header className={styles.dropdownHeader}>
            <div>
              <strong>Notifications</strong>

              {unreadCount > 0 && (
                <span>
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                className={styles.markAllButton}
                type="button"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </header>

          <div className={styles.notificationList}>
            {recentNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle
                  className={styles.emptyIcon}
                  size={28}
                  weight="fill"
                  aria-hidden="true"
                />

                <strong>
                  You're all caught up
                </strong>

                <p>
                  No new notifications right now.
                </p>
              </div>
            ) : (
              recentNotifications.map(
                (notification) => (
                  <Link
                    key={notification.id}
                    to={notification.href || '#'}
                    className={`${styles.notification} ${
                      !notification.read
                        ? styles.unread
                        : ''
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                      )
                    }
                  >
                    <span
                      className={`${styles.typeIcon} ${
                        styles[
                          `type-${notification.type}`
                        ] || ''
                      }`}
                    >
                      {(() => {
                        const TypeIcon =
                          typeIcons[
                            notification.type
                          ]

                        return TypeIcon ? (
                          <TypeIcon
                            size={14}
                            weight="fill"
                            aria-hidden="true"
                          />
                        ) : (
                          <span
                            className={
                              styles.typeDot
                            }
                            aria-hidden="true"
                          />
                        )
                      })()}
                    </span>

                    <span
                      className={
                        styles.notificationContent
                      }
                    >
                      <strong>
                        {notification.title}
                      </strong>

                      <span>
                        {notification.message}
                      </span>

                      <small>
                        {notification.time}
                      </small>
                    </span>

                    {!notification.read && (
                      <span
                        className={styles.unreadDot}
                        aria-label="Unread"
                      />
                    )}
                  </Link>
                ),
              )
            )}
          </div>

          <footer className={styles.dropdownFooter}>
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </footer>
        </div>
      )}
    </div>
  )
}