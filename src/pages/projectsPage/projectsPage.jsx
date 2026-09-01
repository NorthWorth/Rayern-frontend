import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Input from '../../components/forms/input.jsx'
import Select from '../../components/forms/select.jsx'
import Textarea from '../../components/forms/textarea.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import { useProjects } from '../../context/projectContext.jsx'
import { useClients } from '../../context/clientContext.jsx'

import styles from './projectsPage.module.css'

const statusOptions = [
  { value: 'Planning', label: 'Planning' },
  { value: 'Active', label: 'Active' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
]

const initialForm = {
  name: '',
  client: '',
  due: '',
  priority: 'Medium',
  status: 'Planning',
  notes: '',
}

export default function ProjectsPage() {
  const navigate = useNavigate()

  const {
    projects,
    isLoading,
    error,
    addProject,
    clearError,
  } = useProjects()

  const {
    clients,
    isLoading: clientsLoading,
  } = useClients()

  const [searchParams, setSearchParams] =
    useSearchParams()

  const [isModalOpen, setIsModalOpen] = useState(
    () => searchParams.get('create') === '1',
  )

  const [formValues, setFormValues] =
    useState(initialForm)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [toast, setToast] = useState('')

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] =
    useState('All')

  const [sortBy, setSortBy] =
    useState('dueDate')

  const openModal = () => {
    clearError()
    setFormValues(initialForm)
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      return
    }

    const nextParams = new URLSearchParams(
      searchParams,
    )

    nextParams.delete('create')

    setSearchParams(nextParams, {
      replace: true,
    })
  }, [searchParams, setSearchParams])

  const closeModal = () => {
    if (isSubmitting) return

    setIsModalOpen(false)
    setFormValues(initialForm)
    clearError()
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formValues.name.trim()) {
      return
    }

    if (!formValues.client) {
      return
    }

    setIsSubmitting(true)

    try {
      await addProject({
        name: formValues.name.trim(),
        client: formValues.client,
        dueDate: formValues.due || null,
        priority: formValues.priority,
        status: formValues.status,
        description:
          formValues.notes.trim(),
        progress: 0,
      })

      setFormValues(initialForm)
      setIsModalOpen(false)

      setToast(
        'Project created successfully.',
      )
    } catch {
      // ProjectContext handles and exposes the API error.
    } finally {
      setIsSubmitting(false)
    }
  }

  const getClientName = useCallback((project) => {
    if (
      project.client &&
      typeof project.client === 'object'
    ) {
      return (
        project.client.name ||
        project.client.company ||
        'Unknown client'
      )
    }

    const matchingClient = clients.find(
      (client) =>
        client._id === project.client ||
        client.id === project.client,
    )

    return (
      matchingClient?.name ||
      'Unknown client'
    )
  }, [clients])

  const filteredProjects = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase()

    return [...projects]
      .filter((project) => {
        const clientName = getClientName(
          project,
        )

        const searchableText = [
          project.name,
          project.description,
          project.status,
          project.priority,
          clientName === 'Unknown client'
            ? ''
            : clientName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch,
          )

        const matchesStatus =
          statusFilter === 'All' ||
          project.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((left, right) => {
        if (sortBy === 'name') {
          return (left.name ?? '').localeCompare(
            right.name ?? '',
          )
        }

        if (sortBy === 'progress') {
          return (
            (Number(right.progress) || 0) -
            (Number(left.progress) || 0)
          )
        }

        if (sortBy === 'priority') {
          const priorityOrder = {
            High: 0,
            Medium: 1,
            Low: 2,
          }

          return (
            (priorityOrder[left.priority] ??
              3) -
            (priorityOrder[right.priority] ??
              3)
          )
        }

        if (sortBy === 'status') {
          const statusOrder =
            statusOptions.map(
              (option) => option.value,
            )

          return (
            statusOrder.indexOf(left.status) ===
            -1
              ? statusOrder.length
              : statusOrder.indexOf(
                  left.status,
                )
          ) -
            (statusOrder.indexOf(right.status) ===
            -1
              ? statusOrder.length
              : statusOrder.indexOf(
                  right.status,
                ))
        }

        return (
          new Date(left.dueDate || '9999-12-31') -
          new Date(right.dueDate || '9999-12-31')
        )
      })
  }, [projects, search, statusFilter, sortBy, getClientName])

  const formatDueDate = (project) => {
    const date =
      project.dueDate || project.due

    if (!date) {
      return 'TBD'
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      },
    )
  }

  const openProject = (project) => {
    const projectId =
      project._id || project.id

    if (!projectId) return

    navigate(`/projects/${projectId}`)
  }

  const handleProjectKeyDown = (
    event,
    project,
  ) => {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      openProject(project)
    }
  }

  return (
    <PageLayout
      title="Project Delivery"
      subtitle="Execution"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={openModal}
        >

          <Plus size={15} weight="bold" aria-hidden="true" />

          New Project
        </button>
      }
    >
      <section className="panel page-list-panel">
        <div className={styles.toolbar}>
          <Input
            leadingIcon={MagnifyingGlass}
            label="Search projects"
            name="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name or client"
          />

          <Select
            label="Status"
            name="statusFilter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            options={[
              {
                value: 'All',
                label: 'All statuses',
              },
              ...statusOptions,
            ]}
          />

          <Select
            label="Sort by"
            name="sortBy"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
            options={[
              { value: 'dueDate', label: 'Due date' },
              {
                value: 'progress',
                label: 'Progress',
              },
              { value: 'name', label: 'Name' },
              {
                value: 'priority',
                label: 'Priority',
              },
              { value: 'status', label: 'Status' },
            ]}
          />
        </div>

        <div className="panel-header">
          <div>
            <p className="eyebrow">
              Operations
            </p>

            <h3>
              Delivery schedule
            </h3>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="project-list">
            <div className="project-row">
              <div>
                <strong>
                  Loading projects...
                </strong>

                <span>
                  Please wait
                </span>
              </div>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <strong>
              No projects yet
            </strong>

            <p
              style={{
                color:
                  'var(--text-secondary)',
                marginTop: '8px',
              }}
            >
              Create your first project to
              start managing client work.
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <strong>
              No matching projects
            </strong>

            <p
              style={{
                color:
                  'var(--text-secondary)',
                marginTop: '8px',
              }}
            >
              Try adjusting your search or
              status filter.
            </p>
          </div>
        ) : (
          <div className="project-list">
            {filteredProjects.map((project) => {
              const projectId =
                project._id || project.id

              const progress =
                Number(project.progress) || 0

              return (
                <div
                  className="project-row"
                  key={projectId}
                  role="link"
                  tabIndex={0}
                  onClick={() =>
                    openProject(project)
                  }
                  onKeyDown={(event) =>
                    handleProjectKeyDown(
                      event,
                      project,
                    )
                  }
                >
                  <div>
                    <strong>
                      {project.name}
                    </strong>

                    <span>
                      {getClientName(project)}
                    </span>
                  </div>

                  <div className="progress-wrap">
                    <div className="progress-line">
                      <span
                        style={{
                          '--progress-width': `${Math.min(
                            100,
                            Math.max(
                              0,
                              progress,
                            ),
                          )}%`,
                        }}
                      />
                    </div>

                    <small>
                      {progress}%
                    </small>
                  </div>

                  <div>
                    <strong>
                      {formatDueDate(project)}
                    </strong>

                    <span>
                      {project.priority ||
                        'Medium'}{' '}
                      priority
                    </span>
                  </div>

                  <div>
                    <span>
                      {project.status ||
                        'Planning'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Create Project"
        subtitle="New project"
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="project-form"
              disabled={
                isSubmitting ||
                clientsLoading ||
                clients.length === 0
              }
            >
              {isSubmitting
                ? 'Creating...'
                : 'Create Project'}
            </button>
          </>
        }
      >
        <form
          id="project-form"
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          <Input
            label="Project name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            placeholder="Website refresh"
            required
          />

          <Select
            label="Client"
            name="client"
            value={formValues.client}
            onChange={handleChange}
            options={[
              {
                value: '',
                label: clientsLoading
                  ? 'Loading clients...'
                  : clients.length === 0
                    ? 'No clients available'
                    : 'Select a client',
              },
              ...clients.map((client) => ({
                value:
                  client._id ||
                  client.id,
                label: client.company
                  ? `${client.name} — ${client.company}`
                  : client.name,
              })),
            ]}
            disabled={
              clientsLoading ||
              clients.length === 0
            }
            required
          />

          <Input
            label="Due date"
            name="due"
            type="date"
            value={formValues.due}
            onChange={handleChange}
          />

          <Select
            label="Priority"
            name="priority"
            value={formValues.priority}
            onChange={handleChange}
            options={priorityOptions}
          />

          <Select
            label="Status"
            name="status"
            value={formValues.status}
            onChange={handleChange}
            options={statusOptions}
          />

          <Textarea
            label="Notes"
            name="notes"
            value={formValues.notes}
            onChange={handleChange}
            placeholder="Project context and initial scope."
          />
        </form>
      </Modal>

      <Toast
        title="Projects"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}