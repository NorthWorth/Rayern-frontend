import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Drawer from '../../components/ui/drawer/drawer.jsx'
import TaskForm from '../../components/forms/taskForm/taskForm.jsx'
import TaskToolbar from './taskToolbar.jsx'
import TaskCard from './taskCard.jsx'
import TaskEmptyState from './taskEmptyState.jsx'
import Toast from '../../components/ui/toast/toast.jsx'
import ConfirmDialog from '../../components/ui/confirmDialog/confirmDialog.jsx'
import { useTasks } from '../../context/taskContext.jsx'
import { useProjects } from '../../context/projectContext.jsx'
import styles from './tasksPage.module.css'

const boardColumns = ['Todo', 'In Progress', 'Completed']

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

function getTaskId(task) {
  return task?._id ?? task?.id
}

function getProjectId(project) {
  return project?._id ?? project?.id
}

export default function TasksPage() {
  const {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    fetchTasks,
    clearError,
  } = useTasks()

  const { projects = [] } = useProjects()

  const [searchParams, setSearchParams] =
    useSearchParams()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(
    () => searchParams.get('create') === '1',
  )
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sortBy, setSortBy] = useState('dueDate')
  const [viewMode, setViewMode] = useState('board')
  const [formValues, setFormValues] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState({})
  const [editingTask, setEditingTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)

  const searchRef = useRef(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const prevErrorRef = useRef(error)

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      const message = error
      clearError()
      setTimeout(() => {
        setToastMessage(message)
        setToastVisible(true)
      }, 0)
    }

    prevErrorRef.current = error
  }, [error, clearError])

  const openCreateModal = useCallback(() => {
    setFormValues(defaultForm)
    setFormErrors({})
    setIsCreateModalOpen(true)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target
      const isTypingTarget = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if (!isTypingTarget && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        openCreateModal()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openCreateModal])

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return [...tasks]
      .filter((task) => {
        const projectName =
          typeof task.project === 'object'
            ? task.project?.name ?? ''
            : ''

        const searchableText = [
          task.title,
          task.description,
          task.status,
          task.priority,
          projectName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch =
          !normalizedSearch || searchableText.includes(normalizedSearch)

        const matchesPriority =
          priorityFilter === 'All' || task.priority === priorityFilter

        return matchesSearch && matchesPriority
      })
      .sort((left, right) => {
        if (sortBy === 'priority') {
          const priorityOrder = {
            High: 0,
            Medium: 1,
            Low: 2,
          }

          return (
            priorityOrder[left.priority] - priorityOrder[right.priority]
          )
        }

        if (sortBy === 'title') {
          return (left.title ?? '').localeCompare(right.title ?? '')
        }

        return (
          new Date(left.dueDate || '9999-12-31') -
          new Date(right.dueDate || '9999-12-31')
        )
      })
  }, [tasks, search, priorityFilter, sortBy])

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

  const openEditDrawer = (task) => {
    setEditingTask(task)

    const projectId =
      task.project && typeof task.project === 'object'
        ? getProjectId(task.project)
        : task.project ?? ''

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

    setFormErrors({})
    setIsEditDrawerOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setIsSubmitting(false)
    setFormErrors({})
  }

  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false)
    setEditingTask(null)
    setIsSubmitting(false)
    setFormErrors({})
  }

  const showSuccessToast = (message) => {
    setToastMessage(message)
    setToastVisible(true)
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()

    const nextErrors = validateTask(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await addTask({
        project: formValues.project,
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        status: formValues.status,
        priority: formValues.priority,
        dueDate: formValues.dueDate || undefined,
      })

      closeCreateModal()
      showSuccessToast('Task created successfully.')
    } catch (requestError) {
      setToastMessage(
        requestError?.message || 'Failed to create task.',
      )
      setToastVisible(true)
      setIsSubmitting(false)
    }
  }

  const handleEditTask = async (event) => {
    event.preventDefault()

    const nextErrors = validateTask(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    if (!editingTask) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateTask(getTaskId(editingTask), {
        project: formValues.project,
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        status: formValues.status,
        priority: formValues.priority,
        dueDate: formValues.dueDate || undefined,
      })

      closeEditDrawer()
      showSuccessToast('Task updated successfully.')
    } catch (requestError) {
      setToastMessage(
        requestError?.message || 'Failed to update task.',
      )
      setToastVisible(true)
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) {
      return
    }

    try {
      await deleteTask(getTaskId(taskToDelete))

      setTaskToDelete(null)
      setIsDeleteDialogOpen(false)
      showSuccessToast('Task deleted successfully.')
    } catch (requestError) {
      setToastMessage(
        requestError?.message || 'Failed to delete task.',
      )
      setToastVisible(true)
    }
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

  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/plain', String(taskId))
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (event, status) => {
    event.preventDefault()

    const droppedTaskId = event.dataTransfer.getData('text/plain')

    if (!droppedTaskId) {
      return
    }

    const droppedTask = tasks.find(
      (task) => String(getTaskId(task)) === String(droppedTaskId),
    )

    if (!droppedTask || droppedTask.status === status) {
      return
    }

    try {
      await updateTask(getTaskId(droppedTask), {
        status,
      })

      showSuccessToast('Task status updated successfully.')
    } catch (requestError) {
      setToastMessage(
        requestError?.message || 'Failed to update task status.',
      )
      setToastVisible(true)
    }
  }

  const groupedTasks = boardColumns.map((column) => ({
    column,
    tasks: filteredTasks.filter((task) => task.status === column),
  }))

  const renderBoard = () => (
    <div className={styles.boardGrid}>
      {groupedTasks.map((group) => (
        <section className={styles.column} key={group.column}>
          <div className={styles.columnHeader}>
            <span>{group.column}</span>
            <span>{group.tasks.length}</span>
          </div>

          <div
            className={styles.columnBody}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, group.column)}
          >
            {group.tasks.length > 0 ? (
              group.tasks.map((task) => (
                <TaskCard
                  key={getTaskId(task)}
                  task={task}
                  onEdit={openEditDrawer}
                  onDelete={(currentTask) => {
                    setTaskToDelete(currentTask)
                    setIsDeleteDialogOpen(true)
                  }}
                  onDragStart={handleDragStart}
                  onDragOver={(event) => event.preventDefault()}
                />
              ))
            ) : (
              <TaskEmptyState onCreate={openCreateModal} />
            )}
          </div>
        </section>
      ))}
    </div>
  )

  const renderList = () => (
    <div className={styles.listGrid}>
      {filteredTasks.length > 0 ? (
        filteredTasks.map((task) => (
          <TaskCard
            key={getTaskId(task)}
            task={task}
            onEdit={openEditDrawer}
            onDelete={(currentTask) => {
              setTaskToDelete(currentTask)
              setIsDeleteDialogOpen(true)
            }}
            onDragStart={handleDragStart}
            onDragOver={(event) => event.preventDefault()}
          />
        ))
      ) : (
        <TaskEmptyState onCreate={openCreateModal} />
      )}
    </div>
  )

  if (isLoading) {
    return (
      <PageLayout
        title="Task Board"
        subtitle="Team Work"
        actions={
          <button className="primary-btn" type="button" disabled>

            <Plus size={15} weight="bold" aria-hidden="true" />

            Add Task
          </button>
        }
      >
        <PageSection eyebrow="Execution" title="Current work queue">
          <div className={styles.loadingPanel}>
            {Array.from({ length: 3 }, (_, index) => (
              <div className={styles.loadingCard} key={index}>
                <div
                  className={`${styles.loadingLine} ${styles.loadingLineWide}`}
                />
                <div
                  className={`${styles.loadingLine} ${styles.loadingLineMedium}`}
                />
                <div
                  className={`${styles.loadingLine} ${styles.loadingLineShort}`}
                />
              </div>
            ))}
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Task Board"
      subtitle="Team Work"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={openCreateModal}
        >

          <Plus size={15} weight="bold" aria-hidden="true" />

          Add Task
        </button>
      }
    >
      <PageSection eyebrow="Execution" title="Current work queue">
        <TaskToolbar
          search={search}
          onSearchChange={setSearch}
          filter={priorityFilter}
          onFilterChange={setPriorityFilter}
          sort={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onCreate={openCreateModal}
        />

        <div ref={searchRef}>
          {viewMode === 'board' ? renderBoard() : renderList()}
        </div>
      </PageSection>

      <Modal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create Task"
        subtitle="New task"
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={closeCreateModal}
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="create-task-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Create Task'}
            </button>
          </>
        }
      >
        <TaskForm
          values={formValues}
          errors={formErrors}
          projects={projects}
          onChange={handleFieldChange}
          onSubmit={handleCreateTask}
          formId="create-task-form"
        />
      </Modal>

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
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="edit-task-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        <TaskForm
          values={formValues}
          errors={formErrors}
          projects={projects}
          onChange={handleFieldChange}
          onSubmit={handleEditTask}
          formId="edit-task-form"
        />
      </Drawer>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete task"
        message={`Delete “${taskToDelete?.title ?? ''}” from the task workspace?`}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setTaskToDelete(null)
        }}
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