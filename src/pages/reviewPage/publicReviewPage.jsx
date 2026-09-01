import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useParams } from 'react-router-dom'

import {
  Check,
  WarningCircle,
} from '@phosphor-icons/react'

import Badge from '../../components/ui/badge/badge.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'

import {
  useDeliverables,
} from '../../context/deliverableContext.jsx'

import styles from './publicReviewPage.module.css'

function formatDate(value) {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Not set'
  }

  return date.toLocaleDateString(
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

  const date = new Date(value)

  if (
    Number.isNaN(date.getTime())
  ) {
    return ''
  }

  return date.toLocaleString(
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

export default function PublicReviewPage() {
  const { token } = useParams()

  const {
    getPublicReview,
    openPublicReview,
    addPublicComment,
    requestPublicChanges,
    approvePublicDeliverable,
  } = useDeliverables()

  const [deliverable, setDeliverable] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [feedback, setFeedback] =
    useState('')

  const [commentDraft, setCommentDraft] =
    useState('')

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const [message, setMessage] =
    useState('')

  useEffect(() => {
    let cancelled = false

    async function loadReview() {
      setIsLoading(true)
      setError('')

      try {
        const data =
          await getPublicReview(token)

        if (cancelled) {
          return
        }

        setDeliverable(
          data.deliverable ?? null,
        )

        try {
          const opened =
            await openPublicReview(
              token,
            )

          if (
            !cancelled &&
            opened?.deliverable
          ) {
            setDeliverable(
              opened.deliverable,
            )
          }
        } catch {
          // The review itself already loaded.
          // Opening telemetry should not
          // prevent the client from reviewing.
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError?.message ||
              'This review link is unavailable.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    if (token) {
      loadReview()
    } else {
      setError(
        'This review link is invalid.',
      )
      setIsLoading(false)
    }

    return () => {
      cancelled = true
    }
  }, [
    token,
    getPublicReview,
    openPublicReview,
  ])

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
    setMessage('')

    try {
      const data = await action()

      if (data?.deliverable) {
        setDeliverable(
          data.deliverable,
        )
      }

      return data
    } catch (requestError) {
      setMessage(
        requestError?.message ||
          'Something went wrong. Please try again.',
      )

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComment = async (
    event,
  ) => {
    event.preventDefault()

    const trimmed =
      commentDraft.trim()

    if (!trimmed) {
      return
    }

    await runAction(async () => {
      const data =
        await addPublicComment(
          token,
          trimmed,
        )

      setCommentDraft('')
      setMessage(
        'Comment added.',
      )

      return data
    })
  }

  const handleRequestChanges =
    async (event) => {
      event.preventDefault()

      const trimmed =
        feedback.trim()

      if (!trimmed) {
        setMessage(
          'Please describe the changes you need.',
        )

        return
      }

      await runAction(async () => {
        const data =
          await requestPublicChanges(
            token,
            trimmed,
          )

        setFeedback('')

        setMessage(
          'Changes requested.',
        )

        return data
      })
    }

  const handleApprove = async () => {
    await runAction(async () => {
      const data =
        await approvePublicDeliverable(
          token,
        )

      setMessage(
        'Deliverable approved.',
      )

      return data
    })
  }

  if (isLoading) {
    return (
      <main
        className={
          styles.publicReviewPage
        }
      >
        <div
          className={styles.state}
        >
          <EmptyState
            title="Loading review..."
            description="Preparing your client review."
          />
        </div>
      </main>
    )
  }

  if (!deliverable) {
    return (
      <main
        className={
          styles.publicReviewPage
        }
      >
        <div
          className={styles.state}
        >
          <WarningCircle
            size={40}
            weight="duotone"
            aria-hidden="true"
          />

          <EmptyState
            title="Review unavailable"
            description={
              error ||
              'This review link is invalid, expired, or has been revoked.'
            }
          />
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
    typeof deliverable.client ===
    'object'
      ? deliverable.client
      : null

  const status =
    deliverable.status

  const canReview =
    status === 'In Review'

  const canComment =
    status === 'Ready for Review' ||
    status === 'In Review'

  return (
    <main
      className={
        styles.publicReviewPage
      }
    >
      <div
        className={
          styles.reviewShell
        }
      >
        <header
          className={
            styles.reviewHeader
          }
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
              <strong>
                Rayern
              </strong>

              <span>
                Client review
              </span>
            </div>
          </div>

          <span
            className={
              styles.privateLabel
            }
          >
            Private review link
          </span>
        </header>

        <section
          className={styles.hero}
        >
          <span
            className={styles.eyebrow}
          >
            Deliverable review
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

          {project?.name && (
            <p
              className={styles.project}
            >
              {project.name}
            </p>
          )}

          {deliverable.previewImage && (
            <div
              className={
                styles.previewImageWrap
              }
            >
              <img
                src={
                  deliverable.previewImage
                }
                alt="Project preview"
              />
            </div>
          )}

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

          {client?.name && (
            <p
              className={styles.client}
            >
              Prepared for{' '}
              <strong>
                {client.name}
              </strong>
            </p>
          )}
        </section>

        {message && (
          <p
            className={
              styles.statusNotice
            }
            role="status"
          >
            {message}
          </p>
        )}

        <section
          className={
            styles.decisionSection
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
              <h2>
                Your review
              </h2>
            </div>

            {status ===
              'Ready for Review' && (
              <div
                className={
                  styles.actionCopy
                }
              >
                <p>
                  This deliverable is
                  ready for your review.
                </p>

                <p>
                  Open the review when
                  you're ready. Your
                  review will then be
                  recorded for the
                  project.
                </p>
              </div>
            )}

            {canReview && (
              <div
                className={
                  styles.decisionActions
                }
              >
                <form
                  className={
                    styles.feedbackForm
                  }
                  onSubmit={
                    handleRequestChanges
                  }
                >
                  <label htmlFor="client-feedback">
                    Request changes
                  </label>

                  <textarea
                    id="client-feedback"
                    value={feedback}
                    onChange={(event) =>
                      setFeedback(
                        event.target.value,
                      )
                    }
                    placeholder="Tell us what you'd like changed..."
                    rows={4}
                    disabled={
                      isSubmitting
                    }
                  />

                  <button
                    className={
                      styles.secondaryButton
                    }
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !feedback.trim()
                    }
                  >
                    Request changes
                  </button>
                </form>

                <div
                  className={
                    styles.approveBox
                  }
                >
                  <strong>
                    Everything looks good?
                  </strong>

                  <p>
                    Approve the deliverable
                    to complete this
                    review round.
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
                      handleApprove
                    }
                  >
                    <Check
                      size={17}
                      weight="bold"
                      aria-hidden="true"
                    />
                    Approve deliverable
                  </button>
                </div>
              </div>
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
                  requested for this
                  deliverable.
                </p>

                <p>
                  The updated version will
                  appear here when it is
                  submitted for another
                  review round.
                </p>
              </div>
            )}

            {status ===
              'Approved' && (
              <div
                className={
                  styles.approvedState
                }
              >
                <span
                  className={
                    styles.approvedIcon
                  }
                >
                  <Check
                    size={24}
                    weight="bold"
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <h3>
                    Deliverable approved
                  </h3>

                  <p>
                    Thanks for reviewing
                    this deliverable.
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
              <h2>
                Review comments{' '}
                <span
                  className={
                    styles.commentCount
                  }
                >
                  ({comments.length})
                </span>
              </h2>
            </div>

            {comments.length === 0 ? (
              <div
                className={
                  styles.emptyFeedback
                }
              >
                <strong>
                  No comments yet
                </strong>

                <p>
                  Add context or feedback
                  below.
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
                            : 'Rayern'}
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

            {canComment && (
              <form
                className={
                  styles.feedbackForm
                }
                onSubmit={
                  handleComment
                }
              >
                <label htmlFor="client-comment">
                  Add a comment
                </label>

                <textarea
                  id="client-comment"
                  value={
                    commentDraft
                  }
                  onChange={(event) =>
                    setCommentDraft(
                      event.target.value,
                    )
                  }
                  placeholder="Share context or feedback..."
                  rows={3}
                  disabled={
                    isSubmitting
                  }
                />

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
              </form>
            )}
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
