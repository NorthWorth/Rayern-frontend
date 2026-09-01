import { useMemo, useState } from 'react'
import { Plus, MagnifyingGlass, DotsThree } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Input from '../../components/forms/input.jsx'
import Select from '../../components/forms/select.jsx'
import Textarea from '../../components/forms/textarea.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'
import Badge from '../../components/ui/badge/badge.jsx'

import { useLeads } from '../../context/leadContext.jsx'

import styles from './leadsPage.module.css'

const statusOptions = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' },
]

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  website: '',
  company: '',
  source: '',
  status: 'New',
  notes: '',
}

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

export default function LeadsPage() {
  const navigate = useNavigate()

  const {
    leads,
    isLoading,
    error,
    addLead,
    updateLead,
    deleteLead,
    clearError,
  } = useLeads()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)

  const [formValues, setFormValues] = useState(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase()

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        lead.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [leads, search, statusFilter])

  const openCreateModal = () => {
    setEditingLead(null)
    setFormValues(defaultForm)
    setOpenMenuId(null)
    clearError()
    setIsModalOpen(true)
  }

  const openEditModal = (lead) => {
    setEditingLead(lead)
    setOpenMenuId(null)

    setFormValues({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      website: lead.website || '',
      company: lead.company || '',
      source: lead.source || '',
      status: lead.status || 'New',
      notes: lead.notes || '',
    })

    clearError()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return

    setIsModalOpen(false)
    setEditingLead(null)
    setFormValues(defaultForm)
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

    if (
      !formValues.name.trim() ||
      !formValues.email.trim()
    ) {
      return
    }

    setIsSaving(true)

    try {
      if (editingLead) {
        const leadId =
          editingLead._id || editingLead.id

        await updateLead(leadId, formValues)
      } else {
        await addLead(formValues)
      }

      closeModal()
    } catch {
      // LeadContext already stores the API error.
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (lead) => {
    setOpenMenuId(null)

    const confirmed = window.confirm(
      `Delete ${lead.name}? This action cannot be undone.`,
    )

    if (!confirmed) return

    const leadId = lead._id || lead.id

    setDeletingId(leadId)

    try {
      await deleteLead(leadId)
    } catch {
      // LeadContext already stores the API error.
    } finally {
      setDeletingId(null)
    }
  }

  const toggleMenu = (leadId) => {
    setOpenMenuId((currentId) =>
      currentId === leadId ? null : leadId,
    )
  }

  const openLeadProfile = (leadId) => {
    navigate(`/leads/${leadId}`)
  }

  return (
    <PageLayout
      title="Lead Pipeline"
      subtitle="Sales"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={openCreateModal}
        >

          <Plus size={15} weight="bold" aria-hidden="true" />

          New Lead
        </button>
      }
    >
      <PageSection
        eyebrow="Pipeline"
        title="Qualified opportunities"
      >
        <div className={styles.leadToolbar}>
          <div className={styles.leadSearch}>
            <label htmlFor="lead-search">
              Search leads
            </label>

            <MagnifyingGlass
              className={styles.searchIcon}
              size={16}
              weight="bold"
              aria-hidden="true"
            />

          <input
              id="lead-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, email, or company..."
            />
          </div>

          <div className={styles.statusFilter}>
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
          </div>
        </div>

        {error && (
          <div
            className={styles.leadError}
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className={styles.leadTable}>
            <div className={styles.leadTableHeader}>
              <span>Lead</span>
              <span>Contact details</span>
              <span>Status</span>
              <span>Source</span>
              <span>Actions</span>
            </div>

            <div className={styles.leadList}>
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    className={`${styles.leadRow} ${styles.leadSkeleton}`}
                    key={index}
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                ),
              )}
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <EmptyState
            title={
              leads.length === 0
                ? 'No leads yet'
                : 'No matching leads'
            }
            description={
              leads.length === 0
                ? 'Add your first lead to start building your sales pipeline.'
                : 'Try changing your search or status filter.'
            }
          />
        ) : (
          <div className={styles.leadTable}>
            <div className={styles.leadTableHeader}>
              <span>Lead</span>
              <span>Contact details</span>
              <span>Status</span>
              <span>Source</span>
              <span>Actions</span>
            </div>

            <div className={styles.leadList}>
              {filteredLeads.map((lead) => {
                const leadId =
                  lead._id || lead.id

                return (
                  <article
                    className={styles.leadRow}
                    key={leadId}
                    onClick={() =>
                      openLeadProfile(leadId)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault()
                        openLeadProfile(leadId)
                      }
                    }}
                    tabIndex={0}
                    role="link"
                  >
                    <div
                      className={styles.leadPrimary}
                    >
                      <strong>{lead.name}</strong>

                      <span>
                        {lead.company ||
                          'No company'}
                      </span>
                    </div>

                    <div
                      className={styles.leadContact}
                    >
                      <span>
                        {lead.email ||
                          'No email'}
                      </span>

                      {lead.phone && (
                        <span>
                          {lead.phone}
                        </span>
                      )}
                    </div>

                    <div
                      className={styles.leadStatus}
                    >
                      <Badge
                        tone={getStatusTone(
                          lead.status,
                        )}
                      >
                        {lead.status}
                      </Badge>
                    </div>

                    <div
                      className={styles.leadSource}
                    >
                      <span>
                        {lead.source ||
                          'No source'}
                      </span>
                    </div>

                    <div
                      className={styles.leadActions}
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <button
                        className={
                          styles.optionsButton
                        }
                        type="button"
                        aria-label={`Options for ${lead.name}`}
                        aria-expanded={
                          openMenuId === leadId
                        }
                        onClick={() =>
                          toggleMenu(leadId)
                        }
                      >
                        <DotsThree
                          size={18}
                          weight="bold"
                          aria-hidden="true"
                        />
                      </button>

                      {openMenuId === leadId && (
                        <div
                          className={
                            styles.optionsMenu
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(lead)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              styles.deleteMenuItem
                            }
                            disabled={
                              deletingId ===
                              leadId
                            }
                            onClick={() =>
                              handleDelete(lead)
                            }
                          >
                            {deletingId ===
                            leadId
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </PageSection>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          editingLead
            ? 'Edit Lead'
            : 'Create Lead'
        }
        subtitle={
          editingLead
            ? 'Update lead information'
            : 'New opportunity'
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
              form="lead-form"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : editingLead
                  ? 'Save changes'
                  : 'Create Lead'}
            </button>
          </>
        }
      >
        <form
          id="lead-form"
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <Input
            label="Lead name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            placeholder="Ava from NorthPeak"
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleChange}
            placeholder="ava@example.com"
            required
          />

          <Input
            label="Company"
            name="company"
            value={formValues.company}
            onChange={handleChange}
            placeholder="NorthPeak"
          />

          <Input
            label="Phone"
            name="phone"
            value={formValues.phone}
            onChange={handleChange}
            placeholder="+234..."
          />

          <Input
            label="Website"
            name="website"
            value={formValues.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />

          <Input
            label="Source"
            name="source"
            value={formValues.source}
            onChange={handleChange}
            placeholder="X, referral, website..."
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
            placeholder="Context for the opportunity."
          />
        </form>
      </Modal>
    </PageLayout>
  )
}