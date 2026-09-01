import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useAuth } from './authContext.jsx'
import api from '../api/apiClient.js'

const ProjectContext = createContext(null)


export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth()

  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await api.get('/projects')

      setProjects(data.projects || [])
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load projects.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const getProject = useCallback(
    async (id) => {
      return api.get(`/projects/${id}`)
    },
    [],
  )

  const addProject = useCallback(
    async (projectData) => {
      setError('')

      const data = await api.post(
        '/projects',
        projectData,
      )

      const newProject = data.project

      setProjects((current) => [
        newProject,
        ...current,
      ])

      return newProject
    },
    [],
  )

  const updateProject = useCallback(
    async (id, updates) => {
      setError('')

      const data = await api.patch(
        `/projects/${id}`,
        updates,
      )

      const updatedProject = data.project

      setProjects((current) =>
        current.map((project) =>
          project._id === id ||
          project.id === id
            ? updatedProject
            : project,
        ),
      )

      return updatedProject
    },
    [],
  )

  const deleteProject = useCallback(
    async (id) => {
      setError('')

      await api.delete(`/projects/${id}`)

      setProjects((current) =>
        current.filter(
          (project) =>
            project._id !== id &&
            project.id !== id,
        ),
      )
    },
    [],
  )

  const clearError = () => {
    setError('')
  }

  const value = {
    projects,
    isLoading,
    error,
    fetchProjects,
    getProject,
    addProject,
    updateProject,
    deleteProject,
    clearError,
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)

  if (!context) {
    throw new Error(
      'useProjects must be used inside ProjectProvider',
    )
  }

  return context
}