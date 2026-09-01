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

const TaskContext = createContext(null)


export function TaskProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const fetchSequence = useRef(0)

  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTasks = useCallback(
    async (projectId = '') => {
      const requestId =
        ++fetchSequence.current

      if (!isAuthenticated) {
        setTasks([])
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const endpoint = projectId
          ? `/tasks?project=${projectId}`
          : '/tasks'

        const data = await api.get(endpoint)

        if (requestId !== fetchSequence.current) {
          return
        }

        setTasks(data.tasks || [])
      } catch (requestError) {
        if (requestId !== fetchSequence.current) {
          return
        }

        setError(
          requestError.message ||
            'Unable to load tasks.',
        )
      } finally {
        if (requestId === fetchSequence.current) {
          setIsLoading(false)
        }
      }
    },
    [isAuthenticated],
  )

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const getTask = useCallback(
    async (id) => {
      return api.get(`/tasks/${id}`)
    },
    [],
  )

  const addTask = useCallback(
    async (taskData) => {
      setError('')

      const data = await api.post('/tasks', taskData)

      const newTask = data.task

      setTasks((current) => [
        newTask,
        ...current,
      ])

      return newTask
    },
    [],
  )

  const updateTask = useCallback(
    async (id, updates) => {
      setError('')

      const data = await api.patch(
        `/tasks/${id}`,
        updates,
      )

      const updatedTask = data.task

      setTasks((current) =>
        current.map((task) =>
          task._id === id ||
          task.id === id
            ? updatedTask
            : task,
        ),
      )

      return updatedTask
    },
    [],
  )

  const deleteTask = useCallback(
    async (id) => {
      setError('')

      await api.delete(`/tasks/${id}`)

      setTasks((current) =>
        current.filter(
          (task) =>
            task._id !== id &&
            task.id !== id,
        ),
      )
    },
    [],
  )

  const clearError = () => {
    setError('')
  }

  const value = {
    tasks,
    isLoading,
    error,
    fetchTasks,
    getTask,
    addTask,
    updateTask,
    deleteTask,
    clearError,
  }

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)

  if (!context) {
    throw new Error(
      'useTasks must be used inside TaskProvider',
    )
  }

  return context
}