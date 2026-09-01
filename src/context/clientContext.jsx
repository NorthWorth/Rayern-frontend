import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useAuth } from './authContext.jsx'
import api from '../api/apiClient.js'

const ClientContext = createContext(null)

export function ClientProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchClients = useCallback(async () => {
    if (!isAuthenticated) {
      setClients([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await api.get('/clients')

      setClients(data.clients || [])
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load clients.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const getClient = useCallback(
    async (id) => {
      return api.get(`/clients/${id}`)
    },
    [],
  )

  const addClient = useCallback(
    async (clientData) => {
      setError('')

      const data = await api.post(
        '/clients',
        clientData,
      )

      const newClient = data.client

      setClients((current) => [
        newClient,
        ...current,
      ])

      return newClient
    },
    [],
  )

  const updateClient = useCallback(
    async (id, updates) => {
      setError('')

      const data = await api.patch(
        `/clients/${id}`,
        updates,
      )

      const updatedClient = data.client

      setClients((current) =>
        current.map((client) =>
          client._id === id ||
          client.id === id
            ? updatedClient
            : client,
        ),
      )

      return updatedClient
    },
    [],
  )

  const deleteClient = useCallback(
    async (id) => {
      setError('')

      await api.delete(`/clients/${id}`)

      setClients((current) =>
        current.filter(
          (client) =>
            client._id !== id &&
            client.id !== id,
        ),
      )
    },
    [],
  )

  const clearError = () => {
    setError('')
  }

  const value = {
    clients,
    isLoading,
    error,

    fetchClients,
    getClient,
    addClient,
    updateClient,
    deleteClient,
    clearError,
  }

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientContext)

  if (!context) {
    throw new Error(
      'useClients must be used inside ClientProvider',
    )
  }

  return context
}