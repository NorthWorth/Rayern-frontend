import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Textarea from '../../components/forms/textarea.jsx'

import { useProjects } from '../../context/projectContext.jsx'
import { useClients } from '../../context/clientContext.jsx'
import { useDeliverables } from '../../context/deliverableContext.jsx'

import styles from './clientProfilePage.module.css'

export default function ClientProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const {
    getClient,
    updateClient,
    error: clientError,
  } = useClients()

  const { projects } = useProjects()
  const { deliverables } = useDeliverables()

  const [client, setClient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [noteError, setNoteError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadClient() {
      setIsLoading(true)

      try {
        const data = await getClient(id)

        if (!cancelled) {
          setClient(data.client || null)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load client:', error)
          setClient(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadClient()

    return () => {
      cancelled = true
    }
  }, [id, getClient])

  const clientProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.client?._id === id ||
          project.client?.id === id ||
          project.client === id,
      ),
    [projects, id],
  )

  const clientDeliverables = useMemo(
    () =>
      deliverables.filter((item) => {
        const projectClient =
          typeof item.project === 'object'
            ? item.project?.client
            : null

        const projectClientId =
          typeof projectClient === 'object'
            ? (projectClient._id ??
              projectClient.id)
            : projectClient

        return projectClientId === id
      }),
    [deliverables, id],
  )

  const statusTone = useMemo(() => {
    switch ((client?.status || '').toLowerCase()) {
      case 'active':
        return 'active'

      case 'prospect':
        return 'lead'

      case 'at risk':
        return 'warning'

      default:
        return 'inactive'
    }
  }, [client?.status])

  const awaitingReview = clientDeliverables.filter(
    (item) =>
      item.status === 'Ready for Review' ||
      item.status === 'In Review',
  ).length

  const approvedDeliverables = clientDeliverables.filter(
    (item) => item.status === 'Approved',
  ).length

  const openNoteModal = () => {
    setNoteDraft(client?.notes || '')
    setNoteError('')
    setIsNoteModalOpen(true)
  }

  const closeNoteModal = () => {
    if (isSavingNote) return

    setNoteDraft('')
    setNoteError('')
    setIsNoteModalOpen(false)
  }

  const saveNote = async (event) => {
    event.preventDefault()

    const notes = noteDraft.trim()

    if (!notes) {
      setNoteError('Please enter a note.')
      return
    }

    setIsSavingNote(true)
    setNoteError('')

    try {
      const updatedClient = await updateClient(id, {
        notes,
      })

      setClient(updatedClient)
      setIsNoteModalOpen(false)
      setNoteDraft('')
    } catch (error) {
      setNoteError(
        error.message || 'Unable to save note.',
      )
    } finally {
      setIsSavingNote(false)
    }
  }

  const openProject = (project) => {
    const projectId =
      project._id || project.id

    if (!projectId) {
      return
    }

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

  if (isLoading) {
    return (
      <PageLayout
        title="Client"
        subtitle="Loading client..."
      >
        <PageSection>
          <div className={styles.emptyState}>
            Loading client...
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  if (!client) {
    return (
      <PageLayout
        title="Client not found"
        subtitle="The client you're looking for doesn't exist."
        actions={
          <Link
            to="/clients"
            className={styles.backButton}
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            Back to clients
          </Link>
        }
      >
        <PageSection>
          <div className={styles.emptyState}>
            <h3>Client not found</h3>

            <p>
              {clientError ||
                'This client may have been removed or the link may be invalid.'}
            </p>
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={client.name || 'Client'}
      subtitle="Client relationship"
      actions={
        <Link
          to="/clients"
          className={styles.backButton}
        >
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          Back to clients
        </Link>
      }
    >
      <PageSection>
        <div className={styles.profileHeader}>
          <div className={styles.identity}>
            <Avatar
              name={client.name}
              size="lg"
              color={client.avatar || 'indigo'}
            />

            <div className={styles.identityCopy}>
              <div className={styles.nameRow}>
                <div>
                  <h2>{client.name}</h2>

                  {client.company && (
                    <p>{client.company}</p>
                  )}
                </div>

                <Badge tone={statusTone}>
                  {client.status}
                </Badge>
              </div>

              {client.industry && (
                <p>{client.industry}</p>
              )}

              {(client.email ||
                client.phone ||
                client.website) && (
                <div className={styles.contactRow}>
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                    >
                      {client.email}
                    </a>
                  )}

                  {client.phone && (
                    <a href={`tel:${client.phone}`}>
                      {client.phone}
                    </a>
                  )}

                  {client.website && (
                    <a
                      href={
                        client.website.startsWith(
                          'http',
                        )
                          ? client.website
                          : `https://${client.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={openNoteModal}
            >
              Add note
            </button>

            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => navigate('/projects')}
            >
              New project
            </button>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <span>Active projects</span>
            <strong>{clientProjects.length}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Awaiting review</span>
            <strong>{awaitingReview}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Approved deliverables</span>
            <strong>{approvedDeliverables}</strong>
          </article>
        </div>

        <div className={styles.profileGrid}>
          <section className={styles.profilePanel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Work
                </span>

                <h3>Projects</h3>
              </div>

              <button
                className={styles.textButton}
                type="button"
                onClick={() => navigate('/projects')}
              >
                View all
              </button>
            </div>

            {clientProjects.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>No projects yet</strong>

                <p>
                  Projects for this client will appear
                  here.
                </p>
              </div>
            ) : (
              <div className={styles.projectList}>
                {clientProjects.map((project) => {
                  const currentProjectId =
                    project._id || project.id

                  const projectDeliverables =
                    clientDeliverables.filter(
                      (item) => {
                        const deliverableProjectId =
                          typeof item.project ===
                          'object'
                            ? (item.project
                                ?._id ??
                              item.project?.id)
                            : item.project

                        return (
                          deliverableProjectId ===
                          currentProjectId
                        )
                      },
                    )

                  return (
                    <article
                      className={styles.projectCard}
                      key={project._id || project.id}
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
                      <div
                        className={styles.projectTop}
                      >
                        <div>
                          <strong>
                            {project.name}
                          </strong>

                          <span>
                            {project.status}
                          </span>
                        </div>

                        <Badge tone="active">
                          {project.progress}%
                        </Badge>
                      </div>

                      <p>{project.description}</p>

                      <div
                        className={
                          styles.progressWrap
                        }
                      >
                        <div
                          className={
                            styles.progressLine
                          }
                          aria-hidden="true"
                        >
                          <span
                            style={{
                              '--progress-width': `${project.progress}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div
                        className={
                          styles.projectFooter
                        }
                      >
                        <span>
                          Due{' '}
                          {project.dueDate
                            ? new Date(
                                project.dueDate,
                              ).toLocaleDateString()
                            : 'No due date'}
                        </span>

                        <span>
                          {projectDeliverables.length}{' '}
                          {projectDeliverables.length ===
                          1
                            ? 'deliverable'
                            : 'deliverables'}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className={styles.profilePanel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Client feedback
                </span>

                <h3>Review activity</h3>
              </div>
            </div>

            {clientDeliverables.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>
                  No deliverables yet
                </strong>

                <p>
                  Deliverables and client reviews
                  will appear here.
                </p>
              </div>
            ) : (
              <div className={styles.reviewList}>
                {clientDeliverables.map(
                  (deliverable) => (
                    <article
                      className={styles.reviewItem}
                      key={
                        deliverable._id ??
                        deliverable.id
                      }
                    >
                      <div>
                        <strong>
                          {deliverable.title}
                        </strong>

                        <span>
                          Status:{' '}
                          {deliverable.status}
                          {deliverable.submittedAt
                            ? ` · Submitted ${String(
                                deliverable.submittedAt,
                              ).slice(0, 10)}`
                            : ''}
                        </span>
                      </div>

                      <Badge
                        tone={
                          deliverable.status ===
                          'Approved'
                            ? 'active'
                            : deliverable.status ===
                                'Changes Requested'
                              ? 'inactive'
                              : 'lead'
                        }
                      >
                        {deliverable.status}
                      </Badge>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>

          <section className={styles.profilePanel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Context
                </span>

                <h3>Notes</h3>
              </div>

              <button
                className={styles.textButton}
                type="button"
                onClick={openNoteModal}
              >
                Edit
              </button>
            </div>

            <p className={styles.notes}>
              {client.notes ||
                'No notes have been added for this client yet.'}
            </p>

            {client.tags?.length > 0 && (
              <div className={styles.tags}>
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className={styles.tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        <Modal
          open={isNoteModalOpen}
          onClose={closeNoteModal}
          title="Client note"
          subtitle="Relationship context"
          footer={
            <>
              <button
                className="ghost-btn"
                type="button"
                onClick={closeNoteModal}
                disabled={isSavingNote}
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                type="submit"
                form="client-note-form"
                disabled={isSavingNote}
              >
                {isSavingNote
                  ? 'Saving...'
                  : 'Save note'}
              </button>
            </>
          }
        >
          <form
            id="client-note-form"
            onSubmit={saveNote}
          >
            <Textarea
              label="Notes"
              name="notes"
              value={noteDraft}
              onChange={(event) =>
                setNoteDraft(event.target.value)
              }
              placeholder="Add context for this client relationship."
              required
            />

            {noteError && (
              <p
                role="alert"
                className={styles.errorState}
              >
                {noteError}
              </p>
            )}
          </form>
        </Modal>
      </PageSection>
    </PageLayout>
  )
}