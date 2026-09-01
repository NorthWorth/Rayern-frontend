import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Textarea from '../../components/forms/textarea.jsx'

import { useLeads } from '../../context/leadContext.jsx'

import styles from './leadsProfilePage.module.css'


function getStatusTone(status) {
  switch (status) {
    case 'Won':
      return 'active'

    case 'Lost':
      return 'inactive'

    case 'Qualified':
    case 'Proposal':
      return 'warning'

    default:
      return 'lead'
  }
}

export default function LeadsProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const {
    leads,
    isLoading,
    error,
    getLead,
    updateLead,
    convertLead,
    clearError,
  } = useLeads()

  const [profileLead, setProfileLead] = useState(null)
  const [isFetchingLead, setIsFetchingLead] =
    useState(false)

  const [isNoteModalOpen, setIsNoteModalOpen] =
    useState(false)

  const [noteValue, setNoteValue] = useState('')
  const [isSavingNote, setIsSavingNote] =
    useState(false)

  const [actionError, setActionError] =
    useState('')

  /*
   * Use the lead already loaded in LeadContext first.
   * If it isn't there, fetch the individual lead.
   */
  useEffect(() => {
    const existingLead = leads.find(
      (item) =>
        item._id === id ||
        item.id === id,
    )

    if (existingLead) {
      setProfileLead(existingLead)
      return
    }

    if (!id || !getLead) return

    let isMounted = true

    const loadLead = async () => {
      setIsFetchingLead(true)
      setActionError('')

      try {
        const fetchedLead = await getLead(id)

        if (isMounted) {
          setProfileLead(fetchedLead)
        }
      } catch (requestError) {
        if (isMounted) {
          setActionError(
            requestError.message ||
              'Unable to load this lead.',
          )
        }
      } finally {
        if (isMounted) {
          setIsFetchingLead(false)
        }
      }
    }

    loadLead()

    return () => {
      isMounted = false
    }
  }, [id, leads, getLead])

  /*
   * Keep the profile synchronized when LeadContext
   * updates the lead after editing or saving a note.
   */
  useEffect(() => {
    if (!profileLead) return

    const updatedLead = leads.find(
      (item) =>
        item._id === id ||
        item.id === id,
    )

    if (updatedLead) {
      setProfileLead(updatedLead)
    }
  }, [leads, id, profileLead])

  const openNoteModal = () => {
    setActionError('')
    clearError()

    setNoteValue(profileLead?.notes || '')
    setIsNoteModalOpen(true)
  }

  const closeNoteModal = () => {
    if (isSavingNote) return

    setIsNoteModalOpen(false)
    setNoteValue('')
  }

  const handleNoteSubmit = async (event) => {
    event.preventDefault()

    if (!profileLead) return

    setIsSavingNote(true)
    setActionError('')

    try {
      const leadId =
        profileLead._id || profileLead.id

      const updatedLead = await updateLead(
        leadId,
        {
          notes: noteValue.trim(),
        },
      )

      setProfileLead(updatedLead)
      closeNoteModal()
    } catch (requestError) {
      setActionError(
        requestError.message ||
          'Unable to save the note.',
      )
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleEdit = () => {
    const leadId =
      profileLead._id || profileLead.id

    navigate(`/leads?edit=${leadId}`)
  }

  const [isConverting, setIsConverting] = useState(false)

  const handleConvert = async () => {
    if (isConverting) return

    setIsConverting(true)

    try {
      const result = await convertLead(leadId)

      navigate(`/clients/${result.client._id}`)
    } catch {
      // LeadContext already stores the API error.
    } finally {
      setIsConverting(false)
    }
  }

  if (
    (isLoading || isFetchingLead) &&
    !profileLead
  ) {
    return (
      <PageLayout
        title="Lead"
        subtitle="Loading lead information..."
      >
        <PageSection>
          <div className={styles.loadingState}>
            Loading lead...
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  if (!profileLead) {
    return (
      <PageLayout
        title="Lead not found"
        subtitle={
          actionError ||
          error ||
          "The lead you're looking for doesn't exist."
        }
        actions={
          <button
            className="ghost-btn"
            type="button"
            onClick={() => navigate('/leads')}
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
            Back to leads
          </button>
        }
      >
        <PageSection>
          <div className={styles.emptyState}>
            <h3>Lead not found</h3>

            <p>
              This lead may have been removed or
              the link may be invalid.
            </p>
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  const leadId =
    profileLead._id || profileLead.id

  const isWon =
    profileLead.status === 'Won'

  return (
    <PageLayout
      title={profileLead.name}
      subtitle="Lead profile"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={() => navigate('/leads')}
        >
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          Back to leads
        </button>
      }
    >
      <PageSection>
        {actionError && (
          <div
            className={styles.errorState}
            role="alert"
          >
            <span>{actionError}</span>

            <button
              type="button"
              onClick={() =>
                setActionError('')
              }
            >
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.profileHeader}>
          <div className={styles.identity}>
            <Avatar
              name={profileLead.name}
              size="lg"
              color="indigo"
            />

            <div className={styles.identityCopy}>
              <div className={styles.nameRow}>
                <div>
                  <h2>{profileLead.name}</h2>

                  {profileLead.company && (
                    <p>{profileLead.company}</p>
                  )}
                </div>

                <Badge
                  tone={getStatusTone(
                    profileLead.status,
                  )}
                >
                  {profileLead.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              className="primary-btn"
              type="button"
              onClick={handleEdit}
            >
              Edit lead
            </button>

            {isWon && (
              <button
              className="primary-btn"
              type="button"
              onClick={handleConvert}
              disabled={isConverting}
            >
              {isConverting
                ? 'Converting...'
                : 'Convert to Client'}
            </button>
            )}
          </div>
        </div>

        <div className={styles.profileGrid}>
          <section
            className={styles.profilePanel}
          >
            <div className={styles.panelHeader}>
              <div>
                <span
                  className={styles.eyebrow}
                >
                  Contact
                </span>

                <h3>Lead information</h3>
              </div>
            </div>

            <div className={styles.detailList}>
              <div
                className={styles.detailItem}
              >
                <span>Email</span>

                {profileLead.email ? (
                  <a
                    href={`mailto:${profileLead.email}`}
                  >
                    {profileLead.email}
                  </a>
                ) : (
                  <strong>No email</strong>
                )}
              </div>

              <div
                className={styles.detailItem}
              >
                <span>Phone</span>

                {profileLead.phone ? (
                  <a
                    href={`tel:${profileLead.phone}`}
                  >
                    {profileLead.phone}
                  </a>
                ) : (
                  <strong>No phone</strong>
                )}
              </div>

              <div
                className={styles.detailItem}
              >
                <span>Website</span>

                {profileLead.website ? (
                  <a
                    href={
                      profileLead.website.startsWith(
                        'http',
                      )
                        ? profileLead.website
                        : `https://${profileLead.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {profileLead.website}
                  </a>
                ) : (
                  <strong>No website</strong>
                )}
              </div>

              <div
                className={styles.detailItem}
              >
                <span>Company</span>

                <strong>
                  {profileLead.company ||
                    'No company'}
                </strong>
              </div>

              <div
                className={styles.detailItem}
              >
                <span>Source</span>

                <strong>
                  {profileLead.source ||
                    'No source'}
                </strong>
              </div>

              <div
                className={styles.detailItem}
              >
                <span>Status</span>

                <Badge
                  tone={getStatusTone(
                    profileLead.status,
                  )}
                >
                  {profileLead.status}
                </Badge>
              </div>
            </div>
          </section>

          <section
            className={styles.profilePanel}
          >
            <div className={styles.panelHeader}>
              <div>
                <span
                  className={styles.eyebrow}
                >
                  Context
                </span>

                <h3>Notes</h3>
              </div>

              <button
                className="ghost-btn"
                type="button"
                onClick={openNoteModal}
              >
                {profileLead.notes
                  ? 'Edit note'
                  : 'Add note'}
              </button>
            </div>

            {profileLead.notes ? (
              <p className={styles.notes}>
                {profileLead.notes}
              </p>
            ) : (
              <div
                className={styles.notesEmpty}
              >
                <p>
                  No notes have been added for
                  this lead yet.
                </p>

                <button
                  className="ghost-btn"
                  type="button"
                  onClick={openNoteModal}
                >
                  Add note
                </button>
              </div>
            )}
          </section>
        </div>

        {isWon && (
          <section
            className={styles.conversionPanel}
          >
            <div>
              <span
                className={styles.eyebrow}
              >
                Next step
              </span>

              <h3>
                Ready to become a client
              </h3>

              <p>
                This lead is marked as won.
                Convert it into a client profile
                to continue managing the
                relationship in Rayern.
              </p>
            </div>

            <button
              className="primary-btn"
              type="button"
              onClick={handleConvert}
            >
              Convert to Client
            </button>
          </section>
        )}
      </PageSection>

      <Modal
        open={isNoteModalOpen}
        onClose={closeNoteModal}
        title={
          profileLead.notes
            ? 'Edit note'
            : 'Add note'
        }
        subtitle="Keep important context about this lead in one place."
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
              form="lead-note-form"
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
          id="lead-note-form"
          className={styles.noteForm}
          onSubmit={handleNoteSubmit}
        >
          <Textarea
            label="Note"
            name="notes"
            value={noteValue}
            onChange={(event) =>
              setNoteValue(event.target.value)
            }
            placeholder="Add useful context about this lead..."
          />
        </form>
      </Modal>
    </PageLayout>
  )
}