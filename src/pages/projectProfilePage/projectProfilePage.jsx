import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Input from '../../components/forms/input.jsx'
import Select from '../../components/forms/select.jsx'
import Textarea from '../../components/forms/textarea.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import { useProjects } from '../../context/projectContext.jsx'
import { useClients } from '../../context/clientContext.jsx'
import { useTasks } from '../../context/taskContext.jsx'
import { useDeliverables } from '../../context/deliverableContext.jsx'

import styles from './projectProfilePage.module.css'

const statusOptions = [
  {
    value: 'Planning',
    label: 'Planning',
  },
  {
    value: 'Active',
    label: 'Active',
  },
  {
    value: 'On Hold',
    label: 'On Hold',
  },
  {
    value: 'Completed',
    label: 'Completed',
  },
  {
    value: 'Cancelled',
    label: 'Cancelled',
  },
]

const priorityOptions = [
  {
    value: 'Low',
    label: 'Low',
  },
  {
    value: 'Medium',
    label: 'Medium',
  },
  {
    value: 'High',
    label: 'High',
  },
]

const EMPTY_FORM = {
  name: '',
  client: '',
  description: '',
  status: 'Planning',
  priority: 'Medium',
  startDate: '',
  dueDate: '',
  progress: 0,
}

function getStatusTone(status) {
  switch (status) {
    case 'Active':
      return 'active'

    case 'Completed':
      return 'active'

    case 'On Hold':
      return 'warning'

    case 'Cancelled':
      return 'inactive'

    case 'Planning':
    default:
      return 'lead'
  }
}

function getPriorityTone(priority) {
  switch (priority) {
    case 'High':
      return 'warning'

    case 'Low':
      return 'lead'

    case 'Medium':
    default:
      return 'active'
  }
}

function formatDate(date) {
  if (!date) {
    return 'Not set'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not set'
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

function getClientId(client) {
  if (!client) {
    return null
  }

  if (typeof client === 'object') {
    return client._id || client.id || null
  }

  return client
}

function getClientName(client) {
  if (!client) {
    return 'No client assigned'
  }

  if (typeof client === 'object') {
    return (
      client.name ||
      client.company ||
      'Unknown client'
    )
  }

  return 'Client'
}

export default function ProjectProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    getProject,
    updateProject,
    deleteProject,
    error: projectError,
    clearError,
  } = useProjects()

  const {
    clients,
    isLoading: clientsLoading,
  } = useClients()

  const {
    tasks,
    isLoading: tasksLoading,
    error: tasksError,
    fetchTasks,
  } = useTasks()

  const {
    deliverables,
    isLoading: deliverablesLoading,
    error: deliverablesError,
    fetchDeliverables,
  } = useDeliverables()

  const [project, setProject] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false)

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [isSaving, setIsSaving] =
    useState(false)

  const [isDeleting, setIsDeleting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [toast, setToast] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      setIsLoading(true)
      setError('')
      clearError()

      try {
        const data = await getProject(id)

        if (!cancelled) {
          setProject(data.project || null)
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error(
            'Failed to load project:',
            requestError,
          )

          setProject(null)

          setError(
            requestError.message ||
              'Unable to load project.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      cancelled = true
    }
  }, [id, getProject, clearError])

  useEffect(() => {
    fetchTasks(id)
  }, [id, fetchTasks])

  useEffect(() => {
    fetchDeliverables(id)
  }, [id, fetchDeliverables])

  const projectDeliverables = useMemo(
    () =>
      deliverables.filter((item) => {
        const itemProjectId =
          typeof item.project === 'object'
            ? (item.project._id ??
              item.project.id)
            : item.project

        return itemProjectId === id
      }),
    [deliverables, id],
  )

  const clientId = useMemo(
    () => getClientId(project?.client),
    [project?.client],
  )

  const clientName = useMemo(
    () => getClientName(project?.client),
    [project?.client],
  )

  const progress = useMemo(() => {
    const value =
      Number(project?.progress) || 0

    return Math.min(
      100,
      Math.max(0, value),
    )
  }, [project?.progress])

  const openEditModal = () => {
    if (!project) return

    clearError()
    setError('')

    setForm({
      name: project.name || '',
      client: clientId || '',
      description:
        project.description || '',
      status:
        project.status || 'Planning',
      priority:
        project.priority || 'Medium',
      startDate: project.startDate
        ? project.startDate.slice(0, 10)
        : '',
      dueDate: project.dueDate
        ? project.dueDate.slice(0, 10)
        : '',
      progress,
    })

    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    if (isSaving) return

    setIsEditModalOpen(false)
    setForm(EMPTY_FORM)
    setError('')
    clearError()
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleProgressChange = (event) => {
    const value = Number(event.target.value)

    setForm((current) => ({
      ...current,
      progress: Math.min(
        100,
        Math.max(0, value),
      ),
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Project name is required.')
      return
    }

    if (!form.client) {
      setError('A client is required.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const updatedProject =
        await updateProject(id, {
          name: form.name.trim(),
          client: form.client,
          description:
            form.description.trim(),
          status: form.status,
          priority: form.priority,
          startDate:
            form.startDate || null,
          dueDate:
            form.dueDate || null,
          progress: Number(form.progress) || 0,
        })

      setProject(updatedProject)
      setIsEditModalOpen(false)
      setForm(EMPTY_FORM)

      setToast(
        'Project updated successfully.',
      )
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update project.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project || isDeleting) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${project.name}? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      await deleteProject(id)

      navigate('/projects', {
        replace: true,
      })
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to delete project.',
      )

      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <PageLayout
        title="Project"
        subtitle="Loading project..."
      >
        <PageSection>
          <div className={styles.loadingState}>
            Loading project...
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  if (!project) {
    return (
      <PageLayout
        title="Project not found"
        subtitle="The project you're looking for doesn't exist."
        actions={
          <Link
            to="/projects"
            className={styles.backButton}
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            Back to projects
          </Link>
        }
      >
        <PageSection>
          <div className={styles.emptyState}>
            <h3>Project not found</h3>

            <p>
              {error ||
                projectError ||
                'This project may have been removed or the link may be invalid.'}
            </p>
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={project.name}
      subtitle="Project workspace"
      actions={
        <Link
          to="/projects"
          className={styles.backButton}
        >
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          Back to projects
        </Link>
      }
    >
      <PageSection>
        <div className={styles.page}>
          {error && (
            <div
              className={styles.errorState}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Project header */}

          <section className={styles.profileHeader}>
            <div className={styles.projectIdentity}>
              <Avatar
                name={project.name}
                size="lg"
                color="indigo"
              />

              <div
                className={
                  styles.identityCopy
                }
              >
                <div
                  className={styles.nameRow}
                >
                  <div>
                    <h2>{project.name}</h2>

                    {clientId ? (
                      <Link
                        to={`/clients/${clientId}`}
                        className={
                          styles.projectClientLink
                        }
                      >
                        Client:{' '}
                        {clientName}
                      </Link>
                    ) : (
                      <span
                        className={
                          styles.projectClientLink
                        }
                      >
                        Client:{' '}
                        {clientName}
                      </span>
                    )}
                  </div>
                </div>

                {project.description && (
                  <p
                    className={
                      styles.description
                    }
                  >
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div
              className={styles.headerActions}
            >
              <button
                className={
                  styles.secondaryButton
                }
                type="button"
                onClick={openEditModal}
              >
                Edit project
              </button>

              <button
                className={
                  styles.deleteButton
                }
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </section>

          {/* Project KPI cards */}

          <section
            className={styles.summaryGrid}
          >
            <article
              className={styles.summaryCard}
            >
              <span>Status</span>

              <Badge
                tone={getStatusTone(
                  project.status,
                )}
              >
                {project.status}
              </Badge>
            </article>

            <article
              className={styles.summaryCard}
            >
              <span>Priority</span>

              <Badge
                tone={getPriorityTone(
                  project.priority,
                )}
              >
                {project.priority}
              </Badge>
            </article>

            <article
              className={styles.summaryCard}
            >
              <span>Progress</span>

              <strong>
                {progress}%
              </strong>
            </article>

            <article
              className={styles.summaryCard}
            >
              <span>Due date</span>

              <strong>
                {formatDate(
                  project.dueDate,
                )}
              </strong>
            </article>
          </section>

          {/* Main project content */}

          <div
            className={styles.profileGrid}
          >
            <section
              className={styles.profilePanel}
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Delivery
                  </span>

                  <h3>
                    Project progress
                  </h3>
                </div>
              </div>

              <div
                className={
                  styles.progressSection
                }
              >
                <div
                  className={
                    styles.progressHeader
                  }
                >
                  <span>
                    Completion
                  </span>

                  <strong>
                    {progress}%
                  </strong>
                </div>

                <div
                  className={
                    styles.progressTrack
                  }
                >
                  <span
                    className={
                      styles.progressBar
                    }
                    style={{
                      '--progress-width': `${progress}%`,
                    }}
                  />
                </div>
              </div>

            </section>

            <section
              className={styles.profilePanel}
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Client relationship
                  </span>

                  <h3>
                    Client
                  </h3>
                </div>
              </div>

              {clientId ? (
                <Link
                  to={`/clients/${clientId}`}
                  className={
                    styles.clientCard
                  }
                >
                  <div
                    className={
                      styles.clientIdentity
                    }
                  >
                    <Avatar
                      name={clientName}
                      size="md"
                      color="indigo"
                    />

                    <div
                      className={
                        styles.clientIdentityCopy
                      }
                    >
                      <strong>
                        {clientName}
                      </strong>
                    </div>
                  </div>

                  <span
                    className={
                      styles.clientArrow
                    }
                    aria-hidden="true"
                  >
                    <ArrowRight
                      size={15}
                      weight="bold"
                    />
                  </span>
                </Link>
              ) : (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <strong>
                    No client assigned
                  </strong>

                  <p>
                    This project does not
                    currently have a client
                    relationship.
                  </p>
                </div>
              )}
            </section>

            <section
              className={styles.profilePanel}
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Execution
                  </span>

                  <h3>
                    Tasks
                  </h3>
                </div>

                <button
                  className={
                    styles.secondaryButton
                  }
                  type="button"
                  onClick={() =>
                    navigate('/tasks')
                  }
                >
                  New task
                </button>
              </div>

              {tasksLoading ? (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <strong>
                    Loading tasks...
                  </strong>
                </div>
              ) : tasksError ? (
                <div
                  className={
                    styles.errorState
                  }
                  role="alert"
                >
                  {tasksError}
                </div>
              ) : tasks.length === 0 ? (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <strong>
                    No tasks yet
                  </strong>

                  <p>
                    Tasks for this project will
                    appear here. Use the New task
                    button to add the first one.
                  </p>
                </div>
              ) : (
                <div
                  className={styles.taskList}
                >
                  {tasks.map((task) => {
                    const taskId =
                      task._id || task.id

                    return (
                      <Link
                        key={taskId}
                        to={`/tasks/${taskId}`}
                        className={
                          styles.taskRow
                        }
                      >
                        <strong
                          className={
                            styles.taskTitle
                          }
                        >
                          {task.title}
                        </strong>

                        <div
                          className={
                            styles.taskMeta
                          }
                        >
                          <Badge
                            tone={getPriorityTone(
                              task.priority,
                            )}
                          >
                            {task.priority}
                          </Badge>

                          <Badge
                            tone={getStatusTone(
                              task.status,
                            )}
                          >
                            {task.status}
                          </Badge>

                          <span>
                            {formatDate(
                              task.dueDate,
                            ) === 'Not set'
                              ? 'No due date'
                              : `Due ${formatDate(task.dueDate)}`}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <section
              className={styles.profilePanel}
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Delivery
                  </span>

                  <h3>
                    Deliverables
                  </h3>
                </div>

                <button
                  className={
                    styles.secondaryButton
                  }
                  type="button"
                  onClick={() =>
                    navigate('/deliverables')
                  }
                >
                  New deliverable
                </button>
              </div>

              {deliverablesLoading ? (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <strong>
                    Loading deliverables...
                  </strong>
                </div>
              ) : deliverablesError ? (
                <div
                  className={
                    styles.errorState
                  }
                  role="alert"
                >
                  {deliverablesError}
                </div>
              ) : projectDeliverables.length ===
                0 ? (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <strong>
                    No deliverables yet
                  </strong>

                  <p>
                    Work delivered for review on
                    this project will appear here.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    styles.taskList
                  }
                >
                  {projectDeliverables.map(
                    (item) => {
                      const itemId =
                        item._id ?? item.id

                      return (
                        <Link
                          key={itemId}
                          to={`/review/${itemId}`}
                          className={
                            styles.taskRow
                          }
                        >
                          <strong
                            className={
                              styles.taskTitle
                            }
                          >
                            {item.title}
                          </strong>

                          <div
                            className={
                              styles.taskMeta
                            }
                          >
                            <Badge
                              tone={
                                item.status ===
                                'Approved'
                                  ? 'active'
                                  : item.status ===
                                      'Changes Requested'
                                    ? 'inactive'
                                    : 'lead'
                              }
                            >
                              {item.status}
                            </Badge>

                            <span>
                              {item.dueDate
                                ? `Due ${formatDate(item.dueDate)}`
                                : 'No due date'}
                            </span>
                          </div>
                        </Link>
                      )
                    },
                  )}
                </div>
              )}
            </section>

            <section
              className={styles.profilePanel}
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Context
                  </span>

                  <h3>
                    Description
                  </h3>
                </div>
              </div>

              <p
                className={styles.notes}
              >
                {project.description ||
                  'No project description has been added yet.'}
              </p>
            </section>

            <section
              className={styles.profilePanel}
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Project details
                  </span>

                  <h3>
                    Information
                  </h3>
                </div>
              </div>

              <div
                className={styles.detailList}
              >
                <div
                  className={
                    styles.detailItem
                  }
                >
                  <span>
                    Status
                  </span>

                  <Badge
                    tone={getStatusTone(
                      project.status,
                    )}
                  >
                    {project.status}
                  </Badge>
                </div>

                <div
                  className={
                    styles.detailItem
                  }
                >
                  <span>
                    Priority
                  </span>

                  <Badge
                    tone={getPriorityTone(
                      project.priority,
                    )}
                  >
                    {project.priority}
                  </Badge>
                </div>

                <div
                  className={
                    styles.detailItem
                  }
                >
                  <span>
                    Start date
                  </span>

                  <strong>
                    {formatDate(
                      project.startDate,
                    )}
                  </strong>
                </div>

                <div
                  className={
                    styles.detailItem
                  }
                >
                  <span>
                    Due date
                  </span>

                  <strong>
                    {formatDate(
                      project.dueDate,
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageSection>

      {/* Edit project modal */}

      <Modal
        open={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit project"
        subtitle="Update project information"
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={closeEditModal}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="project-edit-form"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : 'Save changes'}
            </button>
          </>
        }
      >
        <form
          id="project-edit-form"
          className={styles.form}
          onSubmit={handleSave}
        >
          <Input
            label="Project name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Project name"
            required
          />

          <Select
            label="Client"
            name="client"
            value={form.client}
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

          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={statusOptions}
          />

          <Select
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            options={priorityOptions}
          />

          <Input
            label="Start date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
          />

          <Input
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
          />

          <Input
            label="Progress"
            name="progress"
            type="number"
            min="0"
            max="100"
            value={form.progress}
            onChange={handleProgressChange}
          />

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Project context and scope."
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