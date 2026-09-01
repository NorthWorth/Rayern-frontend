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
import Drawer from '../../components/ui/drawer/drawer.jsx'
import ConfirmDialog from '../../components/ui/confirmDialog/confirmDialog.jsx'
import TaskForm from '../../components/forms/taskForm/taskForm.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import { useTasks } from '../../context/taskContext.jsx'
import { useProjects } from '../../context/projectContext.jsx'

import styles from './taskProfilePage.module.css'

const defaultForm = {
  title: '',
  description: '',
  project: '',
  priority: 'Medium',
  status: 'Todo',
  dueDate: '',
}

function validateTask(values) {
  const nextErrors = {}

  if (!values.title.trim()) {
    nextErrors.title = 'Task name is required.'
  }

  if (!values.project) {
    nextErrors.project = 'Project is required.'
  }

  return nextErrors
}

function getStatusTone(status) {
  switch (status) {
    case 'In Progress':
      return 'active'

    case 'Completed':
      return 'inactive'

    case 'Todo':
    default:
      return 'lead'
  }
}

function getPriorityTone(priority) {
  switch (priority) {
    case 'High':
      return 'atRisk'

    case 'Low':
      return 'inactive'

    case 'Medium':
    default:
      return 'lead'
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

function getProjectId(project) {
  if (!project) {
    return ''
  }

  if (typeof project === 'object') {
    return project._id || project.id || ''
  }

  return project
}

function getProjectName(project) {
  if (!project) {
    return 'No project assigned'
  }

  if (typeof project === 'object') {
    return project.name || 'Unknown project'
  }

  return 'Project'
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

export default function TaskProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    getTask,
    updateTask,
    deleteTask,
    error: taskError,
    clearError,
  } = useTasks()

  const { projects = [] } = useProjects()

  const [task, setTask] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isEditDrawerOpen, setIsEditDrawerOpen] =
    useState(false)

  const [formValues, setFormValues] =
    useState(defaultForm)

  const [formErrors, setFormErrors] =
    useState({})

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false)

  const [isDeleting, setIsDeleting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [toastMessage, setToastMessage] =
    useState('')

  const [toastVisible, setToastVisible] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTask() {
      setIsLoading(true)
      setError('')
      clearError()

      try {
        const data = await getTask(id)

        if (!cancelled) {
          setTask(data.task || null)
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error(
            'Failed to load task:',
            requestError,
          )

          setTask(null)

          setError(
            requestError.message ||
              'Unable to load task.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTask()

    return () => {
      cancelled = true
    }
  }, [id, getTask, clearError])

  const projectId = useMemo(
    () => getProjectId(task?.project),
    [task?.project],
  )

  const projectName = useMemo(
    () => getProjectName(task?.project),
    [task?.project],
  )

  const clientId = useMemo(
    () => getClientId(task?.project?.client),
    [task?.project?.client],
  )

  const clientName = useMemo(
    () => getClientName(task?.project?.client),
    [task?.project?.client],
  )

  const openEditDrawer = () => {
    if (!task) return

    clearError()
    setError('')
    setFormErrors({})

    setFormValues({
      title: task.title ?? '',
      description: task.description ?? '',
      project: projectId,
      priority: task.priority ?? 'Medium',
      status: task.status ?? 'Todo',
      dueDate: task.dueDate
        ? String(task.dueDate).slice(0, 10)
        : '',
    })

    setIsEditDrawerOpen(true)
  }

  const closeEditDrawer = () => {
    if (isSubmitting) return

    setIsEditDrawerOpen(false)
    setFormValues(defaultForm)
    setFormErrors({})
    setError('')
    clearError()
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))

    setFormErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[name]

      return nextErrors
    })
  }

  const handleSaveTask = async (event) => {
    event.preventDefault()

    const nextErrors = validateTask(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (!task) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const updatedTask =
        await updateTask(id, {
          project: formValues.project,
          title: formValues.title.trim(),
          description: formValues.description.trim(),
          status: formValues.status,
          priority: formValues.priority,
          dueDate: formValues.dueDate || undefined,
        })

      setTask(updatedTask)
      setIsEditDrawerOpen(false)
      setFormValues(defaultForm)

      setToastMessage(
        'Task updated successfully.',
      )
      setToastVisible(true)
    } catch (requestError) {
      setToastMessage(
        requestError?.message ||
          'Failed to update task.',
      )
      setToastVisible(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = () => {
    if (!task) return

    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    if (isDeleting) return

    setIsDeleteDialogOpen(false)
  }

  const handleDeleteTask = async () => {
    if (!task || isDeleting) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      await deleteTask(id)

      navigate('/tasks', {
        replace: true,
      })
    } catch (requestError) {
      setToastMessage(
        requestError?.message ||
          'Failed to delete task.',
      )
      setToastVisible(true)

      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <PageLayout
        title="Task"
        subtitle="Loading task..."
      >
        <PageSection>
          <div className={styles.loadingState}>
            Loading task...
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  if (!task) {
    return (
      <PageLayout
        title="Task not found"
        subtitle="The task you're looking for doesn't exist."
        actions={
          <Link
            to="/tasks"
            className={styles.backButton}
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            Back to Tasks
          </Link>
        }
      >
        <PageSection>
          <div className={styles.emptyState}>
            <h3>Task not found</h3>

            <p>
              {error ||
                taskError ||
                'This task may have been removed or the link may be invalid.'}
            </p>
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={task.title}
      subtitle="Task workspace"
      actions={
        <Link
          to="/tasks"
          className={styles.backButton}
        >
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          Back to Tasks
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

          {/* Task header */}

          <section className={styles.profileHeader}>
            <div className={styles.taskIdentity}>
              <Avatar
                name={task.title}
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
                    <h2>{task.title}</h2>

                    <div
                      className={
                        styles.badgesRow
                      }
                    >
                      <Badge
                        tone={getStatusTone(
                          task.status,
                        )}
                      >
                        {task.status}
                      </Badge>

                      <Badge
                        tone={getPriorityTone(
                          task.priority,
                        )}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {task.description && (
                  <p
                    className={
                      styles.description
                    }
                  >
                    {task.description}
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
                onClick={openEditDrawer}
              >
                Edit Task
              </button>

              <button
                className={
                  styles.deleteButton
                }
                type="button"
                onClick={openDeleteDialog}
                disabled={isDeleting}
              >
                {isDeleting
                  ? 'Deleting...'
                  : 'Delete Task'}
              </button>
            </div>
          </section>

          {/* Task summary cards */}

          <section
            className={styles.summaryGrid}
          >
            <article
              className={styles.summaryCard}
            >
              <span>Status</span>

              <Badge
                tone={getStatusTone(
                  task.status,
                )}
              >
                {task.status}
              </Badge>
            </article>

            <article
              className={styles.summaryCard}
            >
              <span>Priority</span>

              <Badge
                tone={getPriorityTone(
                  task.priority,
                )}
              >
                {task.priority}
              </Badge>
            </article>

            <article
              className={styles.summaryCard}
            >
              <span>Due date</span>

              <strong>
                {formatDate(
                  task.dueDate,
                )}
              </strong>
            </article>

            <article
              className={styles.summaryCard}
            >
              <span>Project</span>

              <strong>
                {projectName}
              </strong>
            </article>
          </section>

          {/* Main task content */}

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
                {task.description ||
                  'No task description has been added yet.'}
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
                    Delivery
                  </span>

                  <h3>
                    Project &amp; client
                  </h3>
                </div>
              </div>

              {projectId ? (
                <Link
                  to={`/projects/${projectId}`}
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
                      name={projectName}
                      size="md"
                      color="indigo"
                    />

                    <div
                      className={
                        styles.clientIdentityCopy
                      }
                    >
                      <span
                        className={
                          styles.clientRole
                        }
                      >
                        Project
                      </span>

                      <strong>
                        {projectName}
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
                    No project assigned
                  </strong>

                  <p>
                    This task does not
                    currently belong to a
                    project.
                  </p>
                </div>
              )}

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
                      <span
                        className={
                          styles.clientRole
                        }
                      >
                        Client
                      </span>

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
                    The linked project does
                    not have a client
                    relationship yet.
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
                    Task details
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
                      task.status,
                    )}
                  >
                    {task.status}
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
                      task.priority,
                    )}
                  >
                    {task.priority}
                  </Badge>
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
                      task.dueDate,
                    )}
                  </strong>
                </div>

                <div
                  className={
                    styles.detailItem
                  }
                >
                  <span>
                    Project
                  </span>

                  {projectId ? (
                    <Link
                      to={`/projects/${projectId}`}
                      className={
                        styles.detailLink
                      }
                    >
                      {projectName}
                    </Link>
                  ) : (
                    <strong>
                      {projectName}
                    </strong>
                  )}
                </div>

                <div
                  className={
                    styles.detailItem
                  }
                >
                  <span>
                    Client
                  </span>

                  {clientId ? (
                    <Link
                      to={`/clients/${clientId}`}
                      className={
                        styles.detailLink
                      }
                    >
                      {clientName}
                    </Link>
                  ) : (
                    <strong>
                      {clientName}
                    </strong>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageSection>

      {/* Edit task drawer */}

      <Drawer
        open={isEditDrawerOpen}
        onClose={closeEditDrawer}
        title="Edit Task"
        subtitle="Task details"
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={closeEditDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="task-profile-edit-form"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving…'
                : 'Save changes'}
            </button>
          </>
        }
      >
        <TaskForm
          values={formValues}
          errors={formErrors}
          projects={projects}
          onChange={handleFieldChange}
          onSubmit={handleSaveTask}
          formId="task-profile-edit-form"
        />
      </Drawer>

      {/* Delete confirmation */}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete task"
        message={`Delete “${task?.title ?? ''}” from the task workspace?`}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTask}
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </PageLayout>
  )
}
