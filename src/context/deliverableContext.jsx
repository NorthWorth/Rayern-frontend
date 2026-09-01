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

const DeliverableContext = createContext(null)

export function DeliverableProvider({
  children,
}) {
  const { isAuthenticated } = useAuth()

  const fetchSequence = useRef(0)

  const [deliverables, setDeliverables] =
    useState([])

  const [isLoading, setIsLoading] =
    useState(false)

  const [error, setError] = useState('')

  const fetchDeliverables = useCallback(
    async (projectId = '') => {
      const requestId =
        ++fetchSequence.current

      if (!isAuthenticated) {
        setDeliverables([])
        setIsLoading(false)
        setError('')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const endpoint = projectId
          ? `/deliverables?project=${projectId}`
          : '/deliverables'

        const data = await api.get(endpoint)

        if (
          requestId !==
          fetchSequence.current
        ) {
          return
        }

        setDeliverables(
          data.deliverables || [],
        )
      } catch (requestError) {
        if (
          requestId !==
          fetchSequence.current
        ) {
          return
        }

        setError(
          requestError?.message ||
            'Unable to load deliverables.',
        )
      } finally {
        if (
          requestId ===
          fetchSequence.current
        ) {
          setIsLoading(false)
        }
      }
    },
    [isAuthenticated],
  )

  useEffect(() => {
    fetchDeliverables()
  }, [fetchDeliverables])

  const getDeliverable = useCallback(
    async (id) => {
      return api.get(
        `/deliverables/${id}`,
      )
    },
    [],
  )

  const addDeliverable = useCallback(
    async (deliverableData) => {
      setError('')

      const data = await api.post(
        '/deliverables',
        deliverableData,
      )

      const newDeliverable =
        data.deliverable

      setDeliverables((current) => [
        newDeliverable,
        ...current,
      ])

      return newDeliverable
    },
    [],
  )

  const updateDeliverable = useCallback(
    async (id, updates) => {
      setError('')

      const data = await api.patch(
        `/deliverables/${id}`,
        updates,
      )

      const updatedDeliverable =
        data.deliverable

      setDeliverables((current) =>
        current.map((item) =>
          item._id === id ||
          item.id === id
            ? updatedDeliverable
            : item,
        ),
      )

      return updatedDeliverable
    },
    [],
  )

  const deleteDeliverable = useCallback(
    async (id) => {
      setError('')

      await api.delete(
        `/deliverables/${id}`,
      )

      setDeliverables((current) =>
        current.filter(
          (item) =>
            item._id !== id &&
            item.id !== id,
        ),
      )
    },
    [],
  )

  const submitForReview = useCallback(
    async (id) => {
      return updateDeliverable(id, {
        status: 'Ready for Review',
      })
    },
    [updateDeliverable],
  )

  const startReview = useCallback(
    async (id) => {
      return updateDeliverable(id, {
        status: 'In Review',
      })
    },
    [updateDeliverable],
  )

  const approveDeliverable =
    useCallback(
      async (id) => {
        return updateDeliverable(id, {
          status: 'Approved',
        })
      },
      [updateDeliverable],
    )

  const addReviewComment =
    useCallback(
      async (
        id,
        content,
        authorType = 'user',
        authorName = '',
      ) => {
        setError('')

        const data = await api.post(
          `/deliverables/${id}/comments`,
          {
            content,
            authorType,
            authorName,
          },
        )

        const updatedDeliverable =
          data.deliverable

        setDeliverables((current) =>
          current.map((item) =>
            item._id === id ||
            item.id === id
              ? updatedDeliverable
              : item,
          ),
        )

        return updatedDeliverable
      },
      [],
    )

  const requestChanges = useCallback(
    async (id, comment) => {
      await addReviewComment(
        id,
        comment,
        'user',
        '',
      )

      return updateDeliverable(id, {
        status: 'Changes Requested',
      })
    },
    [
      addReviewComment,
      updateDeliverable,
    ],
  )

  const createReviewAccess =
    useCallback(async (id, expiresAt) => {
      setError('')

      const data = await api.post(
        `/deliverables/${id}/review-access`,
        expiresAt
          ? { expiresAt }
          : {},
      )

      return data
    }, [])

  const getPublicReview =
    useCallback(async (token) => {
      return api.get(
        `/public-review/${encodeURIComponent(
          token,
        )}`,
      )
    }, [])

  const openPublicReview =
    useCallback(async (token) => {
      return api.post(
        `/public-review/${encodeURIComponent(
          token,
        )}/open`,
      )
    }, [])

  const addPublicComment =
    useCallback(
      async (token, content) => {
        return api.post(
          `/public-review/${encodeURIComponent(
            token,
          )}/comments`,
          { content },
        )
      },
      [],
    )

  const requestPublicChanges =
    useCallback(
      async (token, content) => {
        return api.post(
          `/public-review/${encodeURIComponent(
            token,
          )}/request-changes`,
          { content },
        )
      }, [],
    )

  const approvePublicDeliverable =
    useCallback(async (token) => {
      return api.post(
        `/public-review/${encodeURIComponent(
          token,
        )}/approve`,
      )
    }, [])

  const uploadPreviewImage = useCallback(
    async (id, file) => {
      setError('')

      const data = await api.upload(
        `/deliverables/${id}/preview-image`,
        file,
      )

      const updatedDeliverable =
        data.deliverable

      setDeliverables((current) =>
        current.map((item) =>
          item._id === id || item.id === id
            ? updatedDeliverable
            : item,
        ),
      )

      return updatedDeliverable
    },
    [],
  )

  const removePreviewImage = useCallback(
    async (id) => {
      setError('')

      const data = await api.delete(
        `/deliverables/${id}/preview-image`,
      )

      const updatedDeliverable =
        data.deliverable

      setDeliverables((current) =>
        current.map((item) =>
          item._id === id || item.id === id
            ? updatedDeliverable
            : item,
        ),
      )

      return updatedDeliverable
    },
    [],
  )

  const clearError = useCallback(() => {
    setError('')
  }, [])

  const value = {
    deliverables,
    isLoading,
    error,

    fetchDeliverables,
    getDeliverable,

    addDeliverable,
    updateDeliverable,
    deleteDeliverable,

    submitForReview,
    startReview,
    approveDeliverable,
    requestChanges,
    addReviewComment,

    createReviewAccess,

    uploadPreviewImage,
    removePreviewImage,

    getPublicReview,
    openPublicReview,
    addPublicComment,
    requestPublicChanges,
    approvePublicDeliverable,

    clearError,
  }

  return (
    <DeliverableContext.Provider
      value={value}
    >
      {children}
    </DeliverableContext.Provider>
  )
}

export function useDeliverables() {
  const context =
    useContext(DeliverableContext)

  if (!context) {
    throw new Error(
      'useDeliverables must be used inside DeliverableProvider',
    )
  }

  return context
}
