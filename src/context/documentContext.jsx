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

// Talks to the workspace-scoped Rayern Files API.
// The backend owns provider selection, quota checks and
// authorization — this context only reflects its state.

const DocumentContext = createContext(null)

export function DocumentProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const fetchSequence = useRef(0)

  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [storage, setStorage] = useState(null)

  const fetchDocuments = useCallback(async () => {
    const requestId = ++fetchSequence.current

    if (!isAuthenticated) {
      setDocuments([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await api.get('/files')

      if (requestId !== fetchSequence.current) {
        return
      }

      setDocuments(data.files || [])
    } catch (requestError) {
      if (requestId !== fetchSequence.current) {
        return
      }

      setError(
        requestError.message ||
          'Unable to load files.',
      )
    } finally {
      if (requestId === fetchSequence.current) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated])

  // Storage usage comes straight from the backend's
  // authoritative numbers — never hardcoded here.
  const fetchStorage = useCallback(async () => {
    if (!isAuthenticated) {
      setStorage(null)
      return
    }

    try {
      const data = await api.get('/files/storage')

      setStorage(data.storage || null)
    } catch {
      // Non-fatal: the indicator simply stays stale
      // until the next refresh.
    }
  }, [isAuthenticated])

  // Deferred so the first fetch starts after
  // mount instead of during the effect body.
  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 0)

    return () => clearTimeout(timer)
  }, [fetchDocuments])

  useEffect(() => {
    const timer = setTimeout(fetchStorage, 0)

    return () => clearTimeout(timer)
  }, [fetchStorage])

  const uploadDocument = useCallback(
    async (file) => {
      setError('')

      const params = new URLSearchParams({
        name: file.name,
      })

      const data = await api.upload(
        `/files/upload?${params.toString()}`,
        file,
      )

      const newFile = data.file

      setDocuments((current) => [
        newFile,
        ...current,
      ])

      await fetchStorage()

      return newFile
    },
    [fetchStorage],
  )

  const renameDocument = useCallback(
    async (id, title) => {
      setError('')

      const data = await api.patch(
        `/files/${id}`,
        { title },
      )

      const updatedFile = data.file

      setDocuments((current) =>
        current.map((file) =>
          file._id === id ? updatedFile : file,
        ),
      )

      return updatedFile
    },
    [],
  )

  const deleteDocument = useCallback(
    async (id) => {
      setError('')

      await api.delete(`/files/${id}`)

      setDocuments((current) =>
        current.filter(
          (file) => file._id !== id,
        ),
      )

      await fetchStorage()
    },
    [fetchStorage],
  )

  const downloadDocument = useCallback(
    async (document) => {
      const blob = await api.download(
        `/files/${document._id}/download`,
      )

      const url =
        window.URL.createObjectURL(blob)

      const link =
        window.document.createElement('a')

      link.href = url

      link.download =
        document.originalName || document.title

      window.document.body.appendChild(link)

      link.click()

      link.remove()

      window.URL.revokeObjectURL(url)
    },
    [],
  )

  const clearError = () => {
    setError('')
  }

  const value = {
    documents,
    isLoading,
    error,
    storage,
    fetchDocuments,
    fetchStorage,
    uploadDocument,
    renameDocument,
    deleteDocument,
    downloadDocument,
    clearError,
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hooks live beside their provider by project convention
export function useDocuments() {
  const context = useContext(DocumentContext)

  if (!context) {
    throw new Error(
      'useDocuments must be used inside DocumentProvider',
    )
  }

  return context
}
