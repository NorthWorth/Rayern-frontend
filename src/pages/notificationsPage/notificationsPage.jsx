import { Link } from 'react-router-dom'
import { SealCheck, Chats, CheckSquare, ArrowUpRight, UserPlus, CheckCircle, Circle } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import { useNotifications } from '../../context/notificationContext.jsx'

import styles from './notificationsPage.module.css'

const typeIcons = {
  deliverable: SealCheck,
  feedback: Chats,
  task: CheckSquare,
  project: ArrowUpRight,
  client: UserPlus,
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  return (
    <PageLayout
      title="Notifications"
      subtitle="Stay up to date"
    >
      <PageSection>
        <div className={styles.page}>
          <header className={styles.header}>
            <div>
              <span className={styles.eyebrow}>
                Activity
              </span>

              <h2>Your notifications</h2>

              <p>
                Keep track of important updates
                across your workspace.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                className="ghost-btn"
                type="button"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </header>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                  <CheckCircle
                    size={26}
                    weight="fill"
                    aria-hidden="true"
                  />
                </div>

                <h3>
                  You're all caught up
                </h3>

                <p>
                  New activity will appear here.
                </p>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <Link
                    key={notification.id}
                    to={
                      notification.href || '#'
                    }
                    className={`${styles.item} ${
                      !notification.read
                        ? styles.unread
                        : ''
                    }`}
                    onClick={() =>
                      markAsRead(notification.id)
                    }
                  >
                    <div
                      className={
                        styles.icon
                      }
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
                          <Circle
                            size={8}
                            weight="fill"
                            aria-hidden="true"
                          />
                        )
                      })()}
                    </div>

                    <div
                      className={
                        styles.content
                      }
                    >
                      <strong>
                        {notification.title}
                      </strong>

                      <p>
                        {notification.message}
                      </p>

                      <small>
                        {notification.time}
                      </small>
                    </div>

                    {!notification.read && (
                      <span
                        className={
                          styles.unreadDot
                        }
                      />
                    )}
                  </Link>
                ),
              )
            )}
          </div>
        </div>
      </PageSection>
    </PageLayout>
  )
}