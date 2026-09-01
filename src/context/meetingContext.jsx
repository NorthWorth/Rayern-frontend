import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useAuth } from './authContext.jsx'
import api from '../api/apiClient.js'

const MeetingContext = createContext(null)

export function MeetingProvider({
  children,
}) {
  const { isAuthenticated } = useAuth()

  const [meetings, setMeetings] =
    useState([])
  const [isLoading, setIsLoading] =
    useState(false)
  const [error, setError] = useState('')

  const fetchMeetings = useCallback(
    async () => {
      if (!isAuthenticated) {
        setMeetings([])
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data =
          await api.get('/meetings')

        setMeetings(data.meetings || [])
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load meetings.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated],
  )

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const getMeeting = useCallback(
    async (id) => {
      return api.get(`/meetings/${id}`)
    },
    [],
  )

  const addMeeting = useCallback(
    async (meetingData) => {
      setError('')

      const data = await api.post(
        '/meetings',
        meetingData,
      )

      const newMeeting = data.meeting

      setMeetings((current) => [
        newMeeting,
        ...current,
      ])

      return newMeeting
    },
    [],
  )

  const updateMeeting = useCallback(
    async (id, updates) => {
      setError('')

      const data = await api.patch(
        `/meetings/${id}`,
        updates,
      )

      const updatedMeeting =
        data.meeting

      setMeetings((current) =>
        current.map((meeting) =>
          meeting._id === id ||
          meeting.id === id
            ? updatedMeeting
            : meeting,
        ),
      )

      return updatedMeeting
    },
    [],
  )

  const deleteMeeting = useCallback(
    async (id) => {
      setError('')

      await api.delete(`/meetings/${id}`)

      setMeetings((current) =>
        current.filter(
          (meeting) =>
            meeting._id !== id &&
            meeting.id !== id,
        ),
      )
    },
    [],
  )

  const clearError = () => {
    setError('')
  }

  const value = {
    meetings,
    isLoading,
    error,
    fetchMeetings,
    getMeeting,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    clearError,
  }

  return (
    <MeetingContext.Provider
      value={value}
    >
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeetings() {
  const context =
    useContext(MeetingContext)

  if (!context) {
    throw new Error(
      'useMeetings must be used inside MeetingProvider',
    )
  }

  return context
}
