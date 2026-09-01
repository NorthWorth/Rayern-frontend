import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Input from '../../components/forms/input.jsx'
import Select from '../../components/forms/select.jsx'
import Textarea from '../../components/forms/textarea.jsx'
import Toast from '../../components/ui/toast/toast.jsx'
import ConfirmDialog from '../../components/ui/confirmDialog/confirmDialog.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'

import { useMeetings } from '../../context/meetingContext.jsx'
import { useClients } from '../../context/clientContext.jsx'
import { useProjects } from '../../context/projectContext.jsx'

import styles from './meetingsPage.module.css'

const EMPTY_FORM = {
  title: '',
  clientId: '',
  projectId: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  status: 'Scheduled',
}

const statusFilterOptions = [
  'All',
  'Scheduled',
  'Completed',
  'Cancelled',
]

function getStatusTone(status) {
  switch (status) {
    case 'Completed':
      return 'active'

    case 'Cancelled':
      return 'inactive'

    case 'Scheduled':
    default:
      return 'lead'
  }
}

function formatDate(date) {
  if (!date) {
    return 'No date'
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'No date'
  }

  return parsedDate.toLocaleDateString(
    undefined,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )
}

function formatTimeRange(meeting) {
  if (!meeting.startTime && !meeting.endTime) {
    return ''
  }

  if (!meeting.endTime) {
    return meeting.startTime
  }

  return `${meeting.startTime ?? ''}–${meeting.endTime}`
}

export default function MeetingsPage() {
  const {
    meetings,
    isLoading,
    error,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    clearError,
  } = useMeetings()

  const {
    clients,
    isLoading: clientsLoading,
  } = useClients()

  const { projects } = useProjects()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('All')

  const [searchParams, setSearchParams] =
    useSearchParams()

  const [isModalOpen, setIsModalOpen] =
    useState(
      () => searchParams.get('create') === '1',
    )

  const [editingMeeting, setEditingMeeting] =
    useState(null)

  const [form, setForm] = useState(EMPTY_FORM)

  const [formErrors, setFormErrors] =
    useState({})

  const [isSaving, setIsSaving] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState(null)

  const [
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  ] = useState(false)

  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!error) {
      return
    }

    setToast(error)
    clearError()
  }, [error, clearError])

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

  const clientProjects = useMemo(
    () =>
      projects.filter(
        (project) => {
          const projectClientId =
            typeof project.client ===
            'object'
              ? project.client?._id ||
                project.client?.id
              : project.client

          return (
            projectClientId ===
            form.clientId
          )
        },
      ),
    [projects, form.clientId],
  )

  const visibleMeetings = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...meetings]
      .filter((meeting) => {
        const clientName =
          typeof meeting.client === 'object'
            ? meeting.client?.name ?? ''
            : ''

        const projectName =
          typeof meeting.project === 'object'
            ? meeting.project?.name ?? ''
            : ''

        const searchableText = [
          meeting.title,
          meeting.description,
          meeting.location,
          clientName,
          projectName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch =
          !query ||
          searchableText.includes(query)

        const matchesStatus =
          statusFilter === 'All' ||
          meeting.status === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort(
        (left, right) =>
          new Date(right.date ?? 0) -
          new Date(left.date ?? 0),
      )
  }, [meetings, search, statusFilter])

  const openCreateModal = () => {
    setEditingMeeting(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (meeting) => {
    setEditingMeeting(meeting)

    const clientId =
      typeof meeting.client === 'object'
        ? meeting.client?._id ??
          meeting.client?.id ??
          ''
        : meeting.client ?? ''

    const projectId =
      typeof meeting.project === 'object'
        ? meeting.project?._id ??
          meeting.project?.id ??
          ''
        : meeting.project ?? ''

    setForm({
      title: meeting.title ?? '',
      clientId,
      projectId,
      description:
        meeting.description ?? '',
      date: meeting.date
        ? String(meeting.date).slice(0, 10)
        : '',
      startTime: meeting.startTime ?? '',
      endTime: meeting.endTime ?? '',
      location: meeting.location ?? '',
      status: meeting.status ?? 'Scheduled',
    })

    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return

    setIsModalOpen(false)
    setEditingMeeting(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,

      ...(name === 'clientId'
        ? { projectId: '' }
        : {}),
    }))

    setFormErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors
      }

      const nextErrors = {
        ...currentErrors,
      }

      delete nextErrors[name]

      return nextErrors
    })
  }

  const validateMeeting = (values) => {
    const nextErrors = {}

    if (!values.title.trim()) {
      nextErrors.title =
        'Meeting title is required.'
    }

    if (!values.clientId) {
      nextErrors.clientId =
        'Client is required.'
    }

    if (!values.date) {
      nextErrors.date =
        'Meeting date is required.'
    }

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors =
      validateMeeting(form)

    setFormErrors(nextErrors)

    if (
      Object.keys(nextErrors).length > 0
    ) {
      return
    }

    setIsSaving(true)

    const payload = {
      title: form.title.trim(),
      client: form.clientId,
      project: form.projectId || null,
      description: form.description.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      status: form.status,
    }

    try {
      if (editingMeeting) {
        await updateMeeting(
          editingMeeting._id ||
            editingMeeting.id,
          payload,
        )

        setToast(
          'Meeting updated successfully.',
        )
      } else {
        await addMeeting(payload)

        setToast(
          'Meeting scheduled successfully.',
        )
      }

      closeModal()
    } catch (requestError) {
      setToast(
        requestError?.message ||
          'Failed to save the meeting.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteDialog = (meeting) => {
    setDeletingId(
      meeting._id || meeting.id,
    )
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) {
      return
    }

    try {
      await deleteMeeting(deletingId)

      setToast(
        'Meeting deleted successfully.',
      )
    } catch (requestError) {
      setToast(
        requestError?.message ||
          'Failed to delete the meeting.',
      )
    } finally {
      setDeletingId(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const getClientName = (meeting) => {
    if (
      typeof meeting.client === 'object'
    ) {
      return (
        meeting.client?.name ||
        meeting.client?.company ||
        'Unknown client'
      )
    }

    const matchingClient = clients.find(
      (client) =>
        (client._id || client.id) ===
        meeting.client,
    )

    return matchingClient?.name ?? 'Client'
  }

  const getProjectName = (meeting) => {
    if (!meeting.project) {
      return ''
    }

    if (
      typeof meeting.project === 'object'
    ) {
      return meeting.project?.name ?? ''
    }

    const matchingProject = projects.find(
      (project) =>
        (project._id || project.id) ===
        meeting.project,
    )

    return matchingProject?.name ?? ''
  }

  return (
    <PageLayout
      title="Meetings & Notes"
      subtitle="Client Touchpoints"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={openCreateModal}
        >

          <Plus size={15} weight="bold" aria-hidden="true" />

          Schedule
        </button>
      }
    >
      <PageSection>
        <div className={styles.page}>
          <section
            className={styles.toolbar}
          >
            <div
              className={styles.searchWrap}
            >
              <label
                htmlFor="meeting-search"
              >
                Search meetings
              </label>

              <MagnifyingGlass
                className={styles.searchIcon}
                size={16}
                weight="bold"
                aria-hidden="true"
              />

              <input
                id="meeting-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by title, client, or link..."
              />
            </div>

            <div
              className={styles.filterWrap}
            >
              <label
                htmlFor="meeting-status"
              >
                Status
              </label>

              <select
                id="meeting-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                {statusFilterOptions.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ),
                )}
              </select>
            </div>
          </section>

          <section
            className={styles.headerRow}
          >
            <div>
              <span className="eyebrow">
                Calendar
              </span>

              <h2>
                {isLoading
                  ? 'Loading meetings...'
                  : `${visibleMeetings.length} ${
                      visibleMeetings.length ===
                      1
                        ? 'meeting'
                        : 'meetings'
                    }`}
              </h2>
            </div>
          </section>

          {isLoading ? (
            <div
              className={styles.skeletonList}
            >
              {Array.from(
                { length: 3 },
                (_, index) => (
                  <article
                    className={
                      styles.skeletonRow
                    }
                    key={index}
                  />
                ),
              )}
            </div>
          ) : visibleMeetings.length === 0 ? (
            <div
              className={styles.emptyWrap}
            >
              {meetings.length === 0 ? (
                <EmptyState
                  title="No meetings yet"
                  description="Schedule your first client meeting to keep touchpoints organized."
                  actionLabel="Schedule"
                  onAction={
                    openCreateModal
                  }
                />
              ) : (
                <EmptyState
                  title="No matching meetings"
                  description="Try changing your search or status filter."
                />
              )}
            </div>
          ) : (
            <div
              className={
                styles.meetingList
              }
            >
              {visibleMeetings.map(
                (meeting) => {
                  const meetingId =
                    meeting._id ||
                    meeting.id

                  const timeRange =
                    formatTimeRange(
                      meeting,
                    )

                  return (
                    <article
                      className={
                        styles.meetingCard
                      }
                      key={meetingId}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        openEditModal(
                          meeting,
                        )
                      }
                      onKeyDown={(
                        event,
                      ) => {
                        if (
                          event.key ===
                            'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault()
                          openEditModal(
                            meeting,
                          )
                        }
                      }}
                    >
                      <div
                        className={
                          styles.meetingDateBox
                        }
                        aria-hidden="true"
                      >
                        <strong>
                          {formatDate(
                            meeting.date,
                          ).slice(-8)}
                        </strong>
                      </div>

                      <div
                        className={
                          styles.meetingMain
                        }
                      >
                        <div
                          className={
                            styles.meetingTitleRow
                          }
                        >
                          <h3>
                            {meeting.title}
                          </h3>

                          <Badge
                            tone={getStatusTone(
                              meeting.status,
                            )}
                          >
                            {
                              meeting.status
                            }
                          </Badge>
                        </div>

                        <p
                          className={
                            styles.meetingMeta
                          }
                        >
                          <Avatar
                            name={getClientName(
                              meeting,
                            )}
                            size="sm"
                            color="indigo"
                          />

                          <span>
                            {getClientName(
                              meeting,
                            )}

                            {getProjectName(
                              meeting,
                            ) &&
                              ` · ${getProjectName(meeting)}`}
                          </span>
                        </p>

                        {meeting.description && (
                          <p
                            className={
                              styles.meetingDescription
                            }
                          >
                            {
                              meeting.description
                            }
                          </p>
                        )}

                        <div
                          className={
                            styles.meetingFooter
                          }
                        >
                          <span>
                            {timeRange ||
                              formatDate(
                                meeting.date,
                              )}
                          </span>

                          {meeting.location && (
                            <a
                              href={
                                /^https?:\/\//i.test(
                                  meeting.location,
                                )
                                  ? meeting.location
                                  : undefined
                              }
                              target={
                                /^https?:\/\//i.test(
                                  meeting.location,
                                )
                                  ? '_blank'
                                  : undefined
                              }
                              rel="noreferrer"
                              onClick={(
                                event,
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              {
                                meeting.location
                              }
                            </a>
                          )}
                        </div>
                      </div>

                      <button
                        className={`${styles.deleteButton} ghost-btn`}
                        type="button"
                        aria-label={`Delete ${meeting.title}`}
                        disabled={
                          deletingId ===
                          meetingId
                        }
                        onClick={(event) => {
                          event.stopPropagation()
                          openDeleteDialog(
                            meeting,
                          )
                        }}
                      >
                        Delete
                      </button>
                    </article>
                  )
                },
              )}
            </div>
          )}
        </div>
      </PageSection>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          editingMeeting
            ? 'Edit meeting'
            : 'Schedule meeting'
        }
        subtitle={
          editingMeeting
            ? 'Update touchpoint'
            : 'New client touchpoint'
        }
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={closeModal}
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="meeting-form"
              disabled={
                isSaving ||
                clientsLoading ||
                clients.length === 0
              }
            >
              {isSaving
                ? 'Saving...'
                : editingMeeting
                  ? 'Save changes'
                  : 'Schedule meeting'}
            </button>
          </>
        }
      >
        <form
          id="meeting-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className={styles.formGrid}>
            <Input
              label="Meeting title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Weekly strategy review"
              error={formErrors.title}
              required
              autoFocus
            />

            <Select
              label="Client"
              name="clientId"
              value={form.clientId}
              onChange={handleChange}
              options={[
                {
                  value: '',
                  label: clientsLoading
                    ? 'Loading clients...'
                    : clients.length ===
                        0
                      ? 'No clients available'
                      : 'Select a client',
                },
                ...clients.map(
                  (client) => ({
                    value:
                      client._id ||
                      client.id,
                    label: client.company
                      ? `${client.name} — ${client.company}`
                      : client.name,
                  }),
                ),
              ]}
              error={formErrors.clientId}
              disabled={
                clientsLoading ||
                clients.length === 0
              }
              required
            />

            <Select
              label="Project (optional)"
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              options={[
                {
                  value: '',
                  label:
                    !form.clientId
                      ? 'Select a client first'
                      : clientProjects.length ===
                          0
                        ? 'No projects for this client'
                        : 'Select a project',
                },
                ...clientProjects.map(
                  (project) => ({
                    value:
                      project._id ||
                      project.id,
                    label: project.name,
                  }),
                ),
              ]}
              disabled={
                !form.clientId ||
                clientProjects.length === 0
              }
            />

            <Input
              label="Date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              error={formErrors.date}
              required
            />

            <Input
              label="Start time"
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={handleChange}
            />

            <Input
              label="End time"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={handleChange}
            />

            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                {
                  value: 'Scheduled',
                  label: 'Scheduled',
                },
                {
                  value: 'Completed',
                  label: 'Completed',
                },
                {
                  value: 'Cancelled',
                  label: 'Cancelled',
                },
              ]}
            />

            <div
              className={
                styles.fullWidth
              }
            >
              <Input
                label="Location or meeting link"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Office, Zoom, https://..."
              />
            </div>

            <div
              className={
                styles.fullWidth
              }
            >
              <Textarea
                label="Agenda / notes"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What should be covered in this meeting?"
              />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete meeting"
        message="Delete this meeting? This cannot be undone."
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingId(null)
        }}
        onConfirm={handleDelete}
      />

      <Toast
        title="Meetings"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}
