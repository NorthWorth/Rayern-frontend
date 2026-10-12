import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ArrowLeft, Image as ImageIcon } from '@phosphor-icons/react'
import Badge from '../../components/ui/badge/badge.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'
import { useDeliverables } from '../../context/deliverableContext.jsx'
import styles from './reviewPage.module.css'

function formatDate(value) {
  if (!value) return 'Not set'
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return 'Not set'
  return parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimestamp(value) {
  if (!value) return ''
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return ''
  return parsedDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getStatusTone(status) {
  switch (status) {
    case 'Approved': return 'active'
    case 'Changes Requested': return 'inactive'
    default: return 'lead'
  }
}

function getSubmissionForReview(deliverable) {
  if (!deliverable) return null
  const subs = deliverable.submissions
  if (Array.isArray(subs) && subs.length > 0) {
    return subs[subs.length - 1]
  }
  return null
}

export default function ReviewPage() {
  const { id } = useParams()
  const {
    getDeliverable,
    submitForReview,
    requestChanges,
    addReviewComment,
    createReviewAccess,
  } = useDeliverables()
  const [deliverable, setDeliverable] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [rotateArmed, setRotateArmed] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setLoadError('')
      try {
        const data = await getDeliverable(id)
        if (!cancelled) setDeliverable(data.deliverable ?? null)
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(requestError?.message || 'Unable to load this deliverable.')
          setDeliverable(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, getDeliverable])

  const comments = useMemo(() => {
    if (!deliverable?.comments) return []
    return [...deliverable.comments].sort((a, b) => new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0))
  }, [deliverable])

  const submission = useMemo(() => getSubmissionForReview(deliverable), [deliverable])

  const submissionImages = useMemo(() => {
    if (!submission) return []
    return Array.isArray(submission.images) ? submission.images : []
  }, [submission])

  const liveImages = useMemo(() => {
    if (!deliverable) return []
    if (Array.isArray(deliverable.images)) return deliverable.images
    if (deliverable.previewImage?.secureUrl) return [deliverable.previewImage]
    return []
  }, [deliverable])

  const displayImages = useMemo(() => {
    if (submissionImages.length > 0) return submissionImages
    return liveImages
  }, [submissionImages, liveImages])

  // Version identity of what is on screen.
  const submissionCount = Array.isArray(deliverable?.submissions)
    ? deliverable.submissions.length
    : 0

  const submissionVersion = submission?.version ?? (submissionCount || null)

  // Feedback the CLIENT left against the submission
  // under review — kept separate from internal comments
  // so the two workflows never blur together.
  const clientFeedback = useMemo(() => {
    const source = Array.isArray(submission?.feedback)
      ? submission.feedback.filter((entry) => entry.authorType === 'client')
      // Legacy deliverables predate versioning: their
      // client notes live only in the inline comments.
      : comments.filter((entry) => entry.authorType === 'client')

    return source
      .slice()
      .sort((left, right) => new Date(left.createdAt ?? 0) - new Date(right.createdAt ?? 0))
  }, [submission, comments])

  // Internal notes only — client comments are shown in
  // the dedicated client-feedback panel above.
  const internalComments = useMemo(
    () => comments.filter((entry) => entry.authorType !== 'client'),
    [comments],
  )

  const staleApprovalWarning = Boolean(
    deliverable?.status === 'Approved' && deliverable?.contentModifiedSinceApproval,
  )

  const runAction = async (action) => {
    if (isSubmitting) return null
    setIsSubmitting(true)
    setActionMessage('')
    try {
      const updated = await action()
      if (updated) setDeliverable(updated)
      return updated
    } catch (requestError) {
      setActionMessage(requestError?.message || 'The action failed. Please try again.')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestChanges = async (event) => {
    event.preventDefault()
    const trimmed = feedback.trim()
    if (!trimmed) {
      setActionMessage('Please describe the requested changes first.')
      return
    }
    await runAction(async () => {
      const updated = await requestChanges(id, trimmed)
      setFeedback('')
      setActionMessage('Internal revision requested. Feedback was added to the submission under review.')
      return updated
    })
  }

  const handleCopyReviewLink = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setActionMessage('')
    try {
      const data = await createReviewAccess(id, undefined, { rotate: rotateArmed })

      // Hash-only storage: an existing active link cannot be shown
      // again, so require an explicit second click to replace it.
      if (!rotateArmed && data?.active && !data?.reviewUrl) {
        setRotateArmed(true)
        setActionMessage('A review link is already active. Click Copy review link again to replace it — the previous link will stop working.')
        return
      }

      const reviewUrl = data?.reviewUrl
      if (!reviewUrl) throw new Error('The server did not return a review link.')
      await navigator.clipboard.writeText(reviewUrl)
      setRotateArmed(false)
      setActionMessage('Client review link copied. Share it so the client can review this version.')
    } catch (requestError) {
      setActionMessage(requestError?.message || 'Unable to create a review link.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitForReview = () => runAction(async () => {
    const updated = await submitForReview(id)
    setActionMessage('Submitted for review.')
    return updated
  })

  const handleAddComment = async (event) => {
    event.preventDefault()
    const trimmed = commentDraft.trim()
    if (!trimmed || isSubmitting) return
    await runAction(async () => {
      const updated = await addReviewComment(id, trimmed, 'user', '')
      setCommentDraft('')
      return updated
    })
  }

  if (isLoading) {
    return (
      <main className={styles.reviewPage}>
        <div className={styles.notFound}>
          <EmptyState title="Loading deliverable..." description="Fetching the private review workspace." />
        </div>
      </main>
    )
  }

  if (!deliverable) {
    return (
      <main className={styles.reviewPage}>
        <div className={styles.notFound}>
          <EmptyState title="Deliverable not found" description={loadError || 'This deliverable could not be found.'} />
          <p style={{ marginTop: '12px' }}>
            <Link to="/deliverables"><ArrowLeft size={15} weight="bold" aria-hidden="true" /> Back to deliverables</Link>
          </p>
        </div>
      </main>
    )
  }

  const project = typeof deliverable.project === 'object' ? deliverable.project : null
  const client = project && typeof project.client === 'object' ? project.client : null
  const status = deliverable.status

  return (
    <main className={styles.reviewPage}>
      <div className={styles.reviewShell}>
        <header className={styles.reviewHeader}>
          <div className={styles.brand}>
            <div className={styles.brandMark} aria-hidden="true">R</div>
            <div>
              <strong>Rayern</strong>
              <span>Private review workspace</span>
            </div>
          </div>
          <Link to="/deliverables" className={styles.secondaryButton}>All deliverables</Link>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>Internal review</span>
            <div className={styles.titleRow}>
              <h1>{deliverable.title}</h1>
              <Badge tone={getStatusTone(status)}>{status}</Badge>
            </div>
            <div className={styles.meta}>
              {project && (
                <Link to={`/projects/${project._id ?? project.id}`} className={styles.secondaryButton}>
                  Project: {project.name ?? 'Unknown project'}
                </Link>
              )}
              {client && (
                <Link to={`/clients/${client._id ?? client.id}`} className={styles.secondaryButton}>
                  Client: {client.name ?? client.company ?? 'Unknown client'}
                </Link>
              )}
            </div>
            {deliverable.description && <p className={styles.description}>{deliverable.description}</p>}
            <dl className={styles.deliveryMeta}>
              <div><span>Due date</span><strong>{formatDate(deliverable.dueDate)}</strong></div>
              <div><span>Submitted</span><strong>{formatDate(deliverable.submittedAt)}</strong></div>
              <div><span>Reviewed</span><strong>{formatDate(deliverable.reviewedAt)}</strong></div>
            </dl>
          </div>
        </section>

        {actionMessage && <p className={styles.statusNotice} role="status">{actionMessage}</p>}

        {/* Current content: live images + text */}
        <section className={styles.contentGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Current content</h3>
              <span className={styles.muted}>What is saved right now</span>
            </div>
            {displayImages.length > 0 ? (
              <div className={styles.imageGallery}>
                {displayImages.map((img, i) => (
                  <div key={img.publicId || 'img-' + i} className={styles.imageItem}>
                    <img src={img.secureUrl || ''} alt={`Attachment ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noImages}>
                <ImageIcon size={24} weight="duotone" aria-hidden="true" />
                <span>No images attached</span>
              </div>
            )}
            <p className={styles.currentDescription}>
              {deliverable.description ? deliverable.description : <em>No description.</em>}
            </p>
          </div>

          {/* Review decision: the workspace prepares and
              submits; approval itself is the client's
              decision through the secure review link. */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Review status</h3>
              {submissionVersion && (
                <span className={styles.muted}>
                  Submission v{submissionVersion}
                  {submissionCount > 1 ? ` of ${submissionCount}` : ''}
                </span>
              )}
            </div>

            {status === 'Draft' && (
              <div className={styles.actionCopy}>
                <p>This deliverable is still a draft. Submit it when the content is ready for the client to review.</p>
                <button className={styles.primaryButton} type="button" disabled={isSubmitting} onClick={handleSubmitForReview}>
                  Submit for review
                </button>
              </div>
            )}

            {status === 'Ready for Review' && (
              <div className={styles.actionCopy}>
                <p>
                  Submitted for review and waiting for the client. Share the secure review link so they can
                  view this version, leave feedback, request changes, or approve it.
                </p>
                <div className={styles.reviewActions}>
                  <button className={styles.primaryButton} type="button" disabled={isSubmitting} onClick={handleCopyReviewLink}>
                    Copy client review link
                  </button>
                </div>
              </div>
            )}

            {status === 'In Review' && (
              <>
                <div className={styles.actionCopy}>
                  <p>
                    The client has the review open. Approval and change requests come back from them through
                    the secure link.
                  </p>
                  <div className={styles.reviewActions}>
                    <button className={styles.secondaryButton} type="button" disabled={isSubmitting} onClick={handleCopyReviewLink}>
                      Copy client review link
                    </button>
                  </div>
                </div>

                <form className={styles.feedbackForm} onSubmit={handleRequestChanges}>
                  <label htmlFor="review-feedback">Internal revision request</label>
                  <p className={styles.fieldHint}>
                    Team-only note. This does not approve the deliverable — it records feedback against the
                    submission under review and asks the author to revise.
                  </p>
                  <textarea id="review-feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe what should change before this goes back to the client..." rows={4}
                    disabled={isSubmitting} />
                  <div className={styles.reviewActions}>
                    <button className={styles.secondaryButton} type="submit" disabled={isSubmitting || !feedback.trim()}>
                      Request internal changes
                    </button>
                  </div>
                </form>
              </>
            )}

            {status === 'Changes Requested' && (
              <div className={styles.actionCopy}>
                <p>Changes were requested on this submission. Revise the content, then resubmit for another review round.</p>
                <button className={styles.primaryButton} type="button" disabled={isSubmitting} onClick={handleSubmitForReview}>
                  Resubmit for review
                </button>
              </div>
            )}

            {status === 'Approved' && (
              <div className={styles.approvedState}>
                <span className={styles.approvedIcon} aria-hidden="true"><Check size={22} weight="bold" /></span>
                <div>
                  <h3>Deliverable approved</h3>
                  <p>
                    Approved by the client on {formatDate(deliverable.reviewedAt)}
                    {submissionVersion ? ` for submission v${submissionVersion}` : ''}.
                  </p>
                </div>
              </div>
            )}

            {staleApprovalWarning && (
              <p className={styles.warningNotice} role="status">
                Content was edited after approval. The approval above applies to the submitted version — the
                current content still needs a new review round.
              </p>
            )}
          </div>
        </section>

        {/* Review history */}
        <section className={styles.historySection}>
          {/* Client feedback, tied to the submission it
              was written against — never mixed with the
              team's internal notes. */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Client feedback <span className={styles.commentCount}>({clientFeedback.length})</span></h3>
              <span className={styles.muted}>
                {submissionVersion ? `Submission v${submissionVersion}` : 'From the client review link'}
              </span>
            </div>
            {clientFeedback.length === 0 ? (
              <div className={styles.emptyFeedback}>
                <strong>No client feedback yet</strong>
                <p>Feedback and approval decisions from the review link appear here.</p>
              </div>
            ) : (
              <ol className={styles.commentList}>
                {clientFeedback.map((entry) => (
                  <li key={entry.id ?? entry._id ?? entry.createdAt} className={styles.comment}>
                    <div className={styles.commentAuthor}>
                      <strong>{entry.authorName || 'Client'}</strong>
                      <small>{formatTimestamp(entry.createdAt)}</small>
                    </div>
                    <p>{entry.content}</p>
                    {entry.isApproval && <span className={styles.approvalTag}>Approved this version</span>}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Internal comments <span className={styles.commentCount}>({internalComments.length})</span></h3>
              <span className={styles.muted}>Team only</span>
            </div>
            {internalComments.length === 0 ? (
              <div className={styles.emptyFeedback}>
                <strong>No internal notes yet</strong>
                <p>Comments added by your team during review appear here.</p>
              </div>
            ) : (
              <ol className={styles.commentList}>
                {internalComments.map((comment) => (
                  <li key={comment._id ?? comment.id ?? comment.createdAt} className={styles.comment}>
                    <div className={styles.commentAuthor}>
                      <strong>{comment.authorType === 'client' ? comment.authorName ?? 'Client' : 'You'}</strong>
                      <small>{formatTimestamp(comment.createdAt)}</small>
                    </div>
                    <p>{comment.content}</p>
                  </li>
                ))}
              </ol>
            )}
            <form className={styles.feedbackForm} onSubmit={handleAddComment}>
              <label htmlFor="new-comment">Add an internal comment</label>
              <textarea id="new-comment" value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Share context or follow-up notes..." rows={3} disabled={isSubmitting} />
              <div className={styles.reviewActions}>
                <button className={styles.secondaryButton} type="submit" disabled={isSubmitting || !commentDraft.trim()}>
                  Add comment
                </button>
              </div>
            </form>
          </div>
        </section>

        <footer className={styles.reviewFooter}>
          <span>Rayern — organized, not conversations.</span>
        </footer>
      </div>
    </main>
  )
}
