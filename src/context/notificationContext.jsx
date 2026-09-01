// src/context/notificationContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useAuth } from './authContext.jsx'
import api from '../api/apiClient.js'

const NotificationContext = createContext(null)

function formatTime(dateString) {
  const parsed = new Date(dateString)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  const seconds = Math.floor(
    (Date.now() - parsed.getTime()) / 1000,
  )

  if (seconds < 60) {
    return 'Just now'
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} hr ago`
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const fetchSequence = useRef(0)

  const [notifications, setNotifications] =
    useState([])

  const fetchNotifications = useCallback(
    async () => {
      if (!isAuthenticated) {
        setNotifications([])
        return
      }

      const requestId = ++fetchSequence.current

      try {
        const data = await api.get(
          '/notifications',
        )

        if (
          requestId !== fetchSequence.current
        ) {
          return
        }

        setNotifications(
          (data.notifications || []).map(
            (notification) => ({
              ...notification,
              time: formatTime(
                notification.createdAt,
              ),
            }),
          ),
        )
      } catch {
        // The bell simply shows its empty state;
        // notifications are never critical path.
      }
    },
    [isAuthenticated],
  )

  // Deferred so the first fetch starts after
  // mount instead of during the effect body.
  useEffect(() => {
    const timer = setTimeout(
      fetchNotifications,
      0,
    )

    return () => clearTimeout(timer)
  }, [fetchNotifications])

  const unreadCount =
    notifications.filter(
      (notification) => !notification.read,
    ).length

  // Optimistic read state, reconciled with the
  // backend; on failure the next fetch restores
  // server state.
  const markAsRead = useCallback(async (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    )

    try {
      await api.patch(
        `/notifications/${id}/read`,
        {},
      )
    } catch {
      // Keep optimistic UI state.
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    )

    try {
      await api.patch(
        '/notifications/read-all',
        {},
      )
    } catch {
      // Keep optimistic UI state.
    }
  }, [])

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(
    NotificationContext,
  )

  if (!context) {
    throw new Error(
      'useNotifications must be used inside NotificationProvider',
    )
  }

  return context
}
