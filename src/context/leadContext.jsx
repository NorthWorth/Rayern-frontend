import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useAuth } from './authContext.jsx'
import api from '../api/apiClient.js'

const LeadContext = createContext(null)


export function LeadProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchLeads = useCallback(async () => {
    if (!isAuthenticated) {
      setLeads([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await api.get('/leads')

      setLeads(data.leads || [])
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load leads.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const getLead = useCallback(
    async (id) => {
      const data = await api.get(
        `/leads/${id}`,
      )

      return data.lead
    },
    [],
  )

  const addLead = useCallback(
    async (leadData) => {
      setError('')

      const data = await api.post('/leads', leadData)

      const newLead = data.lead

      setLeads((current) => [
        newLead,
        ...current,
      ])

      return newLead
    },
    [],
  )

  const updateLead = useCallback(
    async (id, updates) => {
      setError('')

      const data = await api.patch(
        `/leads/${id}`,
        updates,
      )

      const updatedLead = data.lead

      setLeads((current) =>
        current.map((lead) =>
          lead._id === id ||
          lead.id === id
            ? updatedLead
            : lead,
        ),
      )

      return updatedLead
    },
    [],
  )

  const convertLead = useCallback(
    async (id) => {
      setError('')

      const data = await api.post(
        `/leads/${id}/convert`,
      )

      const convertedLead = data.lead

      setLeads((current) =>
        current.map((lead) =>
          lead._id === id || lead.id === id
            ? convertedLead
            : lead,
        ),
      )

      return {
        lead: convertedLead,
        client: data.client,
      }
    },
    [],
  )

  const deleteLead = useCallback(
    async (id) => {
      setError('')

      await api.delete(`/leads/${id}`)

      setLeads((current) =>
        current.filter(
          (lead) =>
            lead._id !== id &&
            lead.id !== id,
        ),
      )
    },
    [],
  )

  const clearError = useCallback(() => {
    setError('')
  }, [])

  const value = {
    leads,
    isLoading,
    error,
    fetchLeads,
    getLead,
    addLead,
    updateLead,
    convertLead,
    deleteLead,
    clearError,
  }

  return (
    <LeadContext.Provider value={value}>
      {children}
    </LeadContext.Provider>
  )
}

export function useLeads() {
  const context = useContext(LeadContext)

  if (!context) {
    throw new Error(
      'useLeads must be used inside LeadProvider',
    )
  }

  return context
}