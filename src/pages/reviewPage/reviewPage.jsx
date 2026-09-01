import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
  useParams,
} from 'react-router-dom'

import {
  Check,
  ArrowLeft,
} from '@phosphor-icons/react'

import Badge from '../../components/ui/badge/badge.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'

import { useDeliverables } from '../../context/deliverableContext.jsx'

import styles from './reviewPage.module.css'

function formatDate(value) {
  if (!value) {
    return 'Not set'
  }

  const parsedDate = new Date(value)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
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

function formatTimestamp(value) {
  if (!value) {
    return ''
  }

  const parsedDate = new Date(value)

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return ''
  }

  return parsedDate.toLocaleString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function getStatusTone(status) {
  switch (status) {
    case 'Approved':
      return 'active'

    case 'Changes Requested':
      return 'inactive'

    default:
      return 'lead'
  }
}

export default function ReviewPage() {
  const { id } = useParams()

  const {
    getDeliverable,
    submitForReview,
    startReview,
    approveDeliverable,
    requestChanges,
    addReviewComment,
  } = useDeliverables()

  const [deliverable, setDeliverable] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState('')

  const [feedback, setFeedback] =
    useState('')

  const [commentDraft, setCommentDraft] =
    useState('')

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [actionMessage, setActionMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError('')

      try {
        const data =
          await getDeliverable(id)

        if (!cancelled) {
          setDeliverable(
            data.deliverable ?? null,
          )
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError?.message ||
              'Unable to load this deliverable.',
          )

          setDeliverable(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, getDeliverable])

  const comments = useMemo(() => {
    if (!deliverable?.comments) {
      return []
    }

    return [
      ...deliverable.comments,
    ].sort(
      (left, right) =>
        new Date(
          left.createdAt ?? 0,
        ) -
        new Date(
          right.createdAt ?? 0,
        ),
    )
  }, [deliverable])

  const runAction = async (action) => {
    if (isSubmitting) {
      return null
    }

    setIsSubmitting(true)
    setActionMessage('')

    try {
      const updated = await action()

      if (updated) {
        setDeliverable(updated)
      }

      return updated
    } catch (requestError) {
      setActionMessage(
        requestError?.message ||
          'The action failed. Please try again.',
      )

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = () =>
    runAction(async () => {
      const updated =
        await approveDeliverable(id)

      setActionMessage(
        'Deliverable approved.',
      )

      return updated
    })

  const handleRequestChanges =
    async (event) => {
      event.preventDefault()

      const trimmed =
        feedback.trim()

      if (!trimmed) {
        setActionMessage(
          'Please describe the requested changes first.',
        )

        return
      }

      await runAction(async () => {
        const updated =
          await requestChanges(
            id,
            trimmed,
          )

        setFeedback('')

        setActionMessage(
          'Changes requested.',
        )

        return updated
      })
    }

  const handleBeginReview = () =>
    runAction(async () => {
      const updated =
        await startReview(id)

      setActionMessage(
        'Review started.',
      )

      return updated
    })

  const handleSubmitForReview = () =>
    runAction(async () => {
      const updated =
        await submitForReview(id)

      setActionMessage(
        'Submitted for review.',
      )

      return updated
    })

  const handleAddComment =
    async (event) => {
      event.preventDefault()

      const trimmed =
        commentDraft.trim()

      if (
        !trimmed ||
        isSubmitting
      ) {
        return
      }

      await runAction(async () => {
        const updated =
          await addReviewComment(
            id,
            trimmed,
            'user',
            '',
          )

        setCommentDraft('')

        return updated
      })
    }

  if (isLoading) {
    return (
      <main
        className={styles.reviewPage}
      >
        <div
          className={styles.notFound}
        >
          <EmptyState
            title="Loading deliverable..."
            description="Fetching the private review workspace."
          />
        </div>
      </main>
    )
  }

  if (!deliverable) {
    return (
      <main
        className={styles.reviewPage}
      >
        <div
          className={styles.notFound}
        >
          <EmptyState
            title="Deliverable not found"
            description={
              loadError ||
              'This deliverable could not be found.'
            }
          />

          <p
            style={{
              marginTop: '12px',
            }}
          >
            <Link to="/deliverables">
              <ArrowLeft
                size={15}
                weight="bold"
                aria-hidden="true"
              />
              Back to deliverables
            </Link>
          </p>
        </div>
      </main>
    )
  }

  const project =
    typeof deliverable.project ===
    'object'
      ? deliverable.project
      : null

  const client =
    project &&
    typeof project.client ===
      'object'
      ? project.client
      : null

  const status =
    deliverable.status

  return (
    <main
      className={styles.reviewPage}
    >
      <div
        className={styles.reviewShell}
      >
        <header
          className={styles.reviewHeader}
        >
          <div
            className={styles.brand}
          >
            <div
              className={
                styles.brandMark
              }
              aria-hidden="true"
            >
              R
            </div>

            <div>
              <strong>Rayern</strong>
              <span>
                Private review workspace
              </span>
            </div>
          </div>

          <Link
            to="/deliverables"
            className={
              styles.secondaryButton
            }
          >
            All deliverables
          </Link>
        </header>

        <section
          className={styles.hero}
        >
          <div
            className={
              styles.heroContent
            }
          >
            <span
              className={styles.eyebrow}
            >
              Internal review
            </span>

            <div
              className={
                styles.titleRow
              }
            >
              <h1>
                {deliverable.title}
              </h1>

              <Badge
                tone={getStatusTone(
                  status,
                )}
              >
                {status}
              </Badge>
            </div>

            <div
              className={styles.meta}
            >
              {project && (
                <Link
                  to={`/projects/${
                    project._id ??
                    project.id
                  }`}
                  className={
                    styles.secondaryButton
                  }
                >
                  Project:{' '}
                  {project.name ??
                    'Unknown project'}
                </Link>
              )}

              {client && (
                <Link
                  to={`/clients/${
                    client._id ??
                    client.id
                  }`}
                  className={
                    styles.secondaryButton
                  }
                >
                  Client:{' '}
                  {client.name ??
                    client.company ??
                    'Unknown client'}
                </Link>
              )}
            </div>

            {deliverable.description && (
              <p
                className={
                  styles.description
                }
              >
                {deliverable.description}
              </p>
            )}

            <dl
              className={
                styles.deliveryMeta
              }
            >
              <div>
                <span>
                  Due date
                </span>

                <strong>
                  {formatDate(
                    deliverable.dueDate,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Submitted
                </span>

                <strong>
                  {formatDate(
                    deliverable.submittedAt,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Reviewed
                </span>

                <strong>
                  {formatDate(
                    deliverable.reviewedAt,
                  )}
                </strong>
              </div>
            </dl>
          </div>
        </section>

        {actionMessage && (
          <p
            className={
              styles.statusNotice
            }
            role="status"
          >
            {actionMessage}
          </p>
        )}

        <section
          className={
            styles.previewSection
          }
        >
          <div
            className={`${styles.panel} ${styles.approveArea}`}
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <h3>
                Review decision
              </h3>
            </div>

            {status === 'Draft' && (
              <div
                className={
                  styles.actionCopy
                }
              >
                <p>
                  This deliverable is
                  still a draft and has
                  not been sent for
                  review yet.
                </p>

                <button
                  className={
                    styles.primaryButton
                  }
                  type="button"
                  disabled={
                    isSubmitting
                  }
                  onClick={
                    handleSubmitForReview
                  }
                >
                  Submit for review
                </button>
              </div>
            )}

            {status ===
              'Ready for Review' && (
              <div
                className={
                  styles.actionCopy
                }
              >
                <p>
                  This deliverable is
                  ready for client
                  review.
                </p>

                <button
                  className={
                    styles.primaryButton
                  }
                  type="button"
                  disabled={
                    isSubmitting
                  }
                  onClick={
                    handleBeginReview
                  }
                >
                  Begin review
                </button>
              </div>
            )}

            {status === 'In Review' && (
              <form
                className={
                  styles.feedbackForm
                }
                onSubmit={
                  handleRequestChanges
                }
              >
                <label htmlFor="review-feedback">
                  Internal review notes
                </label>

                <textarea
                  id="review-feedback"
                  value={feedback}
                  onChange={(event) =>
                    setFeedback(
                      event.target.value,
                    )
                  }
                  placeholder="Describe what should change before approval..."
                  rows={4}
                  disabled={
                    isSubmitting
                  }
                />

                <div
                  className={
                    styles.reviewActions
                  }
                >
                  <button
                    className={
                      styles.secondaryButton
                    }
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                  >
                    Request changes
                  </button>

                  <button
                    className={
                      styles.primaryButton
                    }
                    type="button"
                    disabled={
                      isSubmitting
                    }
                    onClick={
                      handleApprove
                    }
                  >
                    Approve deliverable
                  </button>
                </div>
              </form>
            )}

            {status ===
              'Changes Requested' && (
              <div
                className={
                  styles.actionCopy
                }
              >
                <p>
                  Changes have been
                  requested. Revise the
                  work and resubmit it
                  for another review
                  round.
                </p>

                <button
                  className={
                    styles.primaryButton
                  }
                  type="button"
                  disabled={
                    isSubmitting
                  }
                  onClick={
                    handleSubmitForReview
                  }
                >
                  Resubmit for review
                </button>
              </div>
            )}

            {status === 'Approved' && (
              <div
                className={
                  styles.approvedState
                }
              >
                <span
                  className={
                    styles.approvedIcon
                  }
                  aria-hidden="true"
                >
                  <Check
                    size={22}
                    weight="bold"
                  />
                </span>

                <div>
                  <h3>
                    Deliverable approved
                  </h3>

                  <p>
                    Reviewed on{' '}
                    {formatDate(
                      deliverable.reviewedAt,
                    )}
                    .
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          className={
            styles.contentGrid
          }
        >
          <div
            className={styles.panel}
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <h3>
                Review history{' '}
                <span
                  className={
                    styles.commentCount
                  }
                >
                  ({comments.length})
                </span>
              </h3>
            </div>

            {comments.length === 0 ? (
              <div
                className={
                  styles.emptyFeedback
                }
              >
                <strong>
                  No feedback yet
                </strong>

                <p>
                  Comments added during
                  review will appear
                  here.
                </p>
              </div>
            ) : (
              <ol
                className={
                  styles.commentList
                }
              >
                {comments.map(
                  (comment) => (
                    <li
                      className={
                        styles.comment
                      }
                      key={
                        comment._id ??
                        comment.id ??
                        comment.createdAt
                      }
                    >
                      <div
                        className={
                          styles.commentAuthor
                        }
                      >
                        <strong>
                          {comment.authorType ===
                          'client'
                            ? comment.authorName ??
                              'Client'
                            : 'You'}
                        </strong>

                        <small>
                          {formatTimestamp(
                            comment.createdAt,
                          )}
                        </small>
                      </div>

                      <p>
                        {
                          comment.content
                        }
                      </p>
                    </li>
                  ),
                )}
              </ol>
            )}

            <form
              className={
                styles.feedbackForm
              }
              onSubmit={
                handleAddComment
              }
            >
              <label htmlFor="new-comment">
                Add an internal comment
              </label>

              <textarea
                id="new-comment"
                value={commentDraft}
                onChange={(event) =>
                  setCommentDraft(
                    event.target.value,
                  )
                }
                placeholder="Share context or follow-up notes..."
                rows={3}
                disabled={
                  isSubmitting
                }
              />

              <div
                className={
                  styles.reviewActions
                }
              >
                <button
                  className={
                    styles.secondaryButton
                  }
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !commentDraft.trim()
                  }
                >
                  Add comment
                </button>
              </div>
            </form>
          </div>
        </section>

        <footer
          className={
            styles.reviewFooter
          }
        >
          <span>
            Rayern — organized, not
            conversations.
          </span>
        </footer>
      </div>
    </main>
  )
}
