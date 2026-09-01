import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Avatar from '../../components/ui/avatar/avatar.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import { DotsThree, MagnifyingGlass } from '@phosphor-icons/react'

import { useClients } from '../../context/clientContext.jsx'

import styles from './clientsPage.module.css'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  website: '',
  company: '',
  status: 'Prospect',
  notes: '',
}

export default function ClientsPage() {
  const navigate = useNavigate()

  const { clients, isLoading, error, addClient, updateClient, deleteClient, clearError } =
    useClients()

  const [searchParams, setSearchParams] =
    useSearchParams()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('All')

  const searchInputRef = useRef(null)

  const [isModalOpen, setIsModalOpen] = useState(
    () => searchParams.get('create') === '1',
  )

  const [editingClient, setEditingClient] =
    useState(null)

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [isSaving, setIsSaving] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState(null)

  const [openMenuId, setOpenMenuId] =
    useState(null)

  const [toast, setToast] = useState('')

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.company
          ?.toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        client.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, search, statusFilter])

  const openCreateModal = () => {
    setEditingClient(null)
    setForm(EMPTY_FORM)
    clearError()
    setIsModalOpen(true)
  }

  useEffect(() => {
    const wantsCreate =
      searchParams.get('create') === '1'

    const wantsFocusSearch =
      searchParams.get('focusSearch') ===
      '1'

    if (!wantsCreate && !wantsFocusSearch) {
      return
    }

    if (wantsFocusSearch) {
      searchInputRef.current?.focus()
    }

    const nextParams = new URLSearchParams(
      searchParams,
    )

    nextParams.delete('create')
    nextParams.delete('focusSearch')

    setSearchParams(nextParams, {
      replace: true,
    })
  }, [searchParams, setSearchParams])

  const openEditModal = (client) => {
    setOpenMenuId(null)
    setEditingClient(client)

    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      company: client.company || '',
      status: client.status || 'Prospect',
      notes: client.notes || '',
    })

    clearError()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (isSaving) return

    setIsModalOpen(false)
    setEditingClient(null)
    setForm(EMPTY_FORM)
    clearError()
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.status
    ) {
      return
    }

    setIsSaving(true)

    try {
      if (editingClient) {
        await updateClient(
          editingClient._id || editingClient.id,
          form,
        )

        setToast('Client updated successfully.')
      } else {
        await addClient(form)

        setToast('Client added successfully.')
      }

      closeModal()
    } catch {
      // ClientContext already stores the error.
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (client) => {
    setOpenMenuId(null)

    const confirmed = window.confirm(
      `Delete ${client.name}? This action cannot be undone.`,
    )

    if (!confirmed) return

    const id = client._id || client.id

    setDeletingId(id)

    try {
      await deleteClient(id)

      setToast('Client deleted successfully.')
    } catch (requestError) {
      setToast(
        requestError?.message ||
          'Unable to delete client.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleCardClick = (clientId) => {
    navigate(`/clients/${clientId}`)
  }

  const handleCardKeyDown = (
    event,
    clientId,
  ) => {
    if (
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      handleCardClick(clientId)
    }
  }

  const toggleMenu = (event, clientId) => {
    event.stopPropagation()

    setOpenMenuId((current) =>
      current === clientId
        ? null
        : clientId,
    )
  }

  return (
    <PageLayout
      title="Clients"
      subtitle="Client relationships"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={openCreateModal}
        >
          Add client
        </button>
      }
    >
      <PageSection>
        <div className={styles.page}>
          <section className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <label htmlFor="client-search">
                Search clients
              </label>

              <MagnifyingGlass
                className={styles.searchIcon}
                size={16}
                weight="bold"
                aria-hidden="true"
              />

            <input
                id="client-search"
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, email, or company..."
              />
            </div>

            <div className={styles.filterWrap}>
              <label htmlFor="client-status">
                Status
              </label>

              <select
                id="client-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Prospect">
                  Prospect
                </option>
                <option value="At Risk">
                  At Risk
                </option>
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </section>

          {error && (
            <div
              className={styles.error}
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

          <section className={styles.headerRow}>
            <div>
              <span className="eyebrow">
                Your workspace
              </span>

              <h2>
                {isLoading
                  ? 'Loading clients...'
                  : `${filteredClients.length} ${
                      filteredClients.length === 1
                        ? 'client'
                        : 'clients'
                    }`}
              </h2>
            </div>
          </section>

          {isLoading ? (
            <div className={styles.clientGrid}>
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <article
                    className={styles.skeletonCard}
                    key={index}
                  >
                    <div
                      className={
                        styles.skeletonAvatar
                      }
                    />

                    <div
                      className={
                        styles.skeletonContent
                      }
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className={styles.empty}>
              {clients.length === 0 ? (
                <EmptyState
                  title="No clients yet"
                  description="Add your first client to start building your workspace."
                />
              ) : (
                <EmptyState
                  title="No matching clients"
                  description="Try changing your search or status filter."
                />
              )}
            </div>
          ) : (
            <div className={styles.clientGrid}>
              {filteredClients.map((client) => {
                const clientId =
                  client._id || client.id

                const isMenuOpen =
                  openMenuId === clientId

                return (
                  <article
                    className={styles.clientCard}
                    key={clientId}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      handleCardClick(clientId)
                    }
                    onKeyDown={(event) =>
                      handleCardKeyDown(
                        event,
                        clientId,
                      )
                    }
                  >
                    <div
                      className={
                        styles.clientCardHeader
                      }
                    >
                      <Avatar
                        name={client.name}
                        size="md"
                        color="indigo"
                      />

                      <Badge
                        tone={
                          client.status ===
                          'Active'
                            ? 'active'
                            : client.status ===
                                'At Risk'
                              ? 'warning'
                              : 'lead'
                        }
                      >
                        {client.status}
                      </Badge>

                      <div
                        className={
                          styles.cardMenu
                        }
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                        onKeyDown={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <button
                          className={
                            styles.moreButton
                          }
                          type="button"
                          aria-label={`More options for ${client.name}`}
                          aria-expanded={
                            isMenuOpen
                          }
                          aria-haspopup="menu"
                          onClick={(event) =>
                            toggleMenu(
                              event,
                              clientId,
                            )
                          }
                        >
                          <DotsThree
                            size={18}
                            weight="bold"
                            aria-hidden="true"
                          />
                        </button>

                        {isMenuOpen && (
                          <div
                            className={
                              styles.cardMenuDropdown
                            }
                            role="menu"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                openEditModal(
                                  client,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              role="menuitem"
                              disabled={
                                deletingId ===
                                clientId
                              }
                              onClick={() =>
                                handleDelete(
                                  client,
                                )
                              }
                            >
                              {deletingId ===
                              clientId
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={
                        styles.clientIdentity
                      }
                    >
                      <h3>{client.name}</h3>

                      {client.company && (
                        <p>{client.company}</p>
                      )}

                      {client.email && (
                        <span>{client.email}</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </PageSection>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          editingClient
            ? 'Edit client'
            : 'Add client'
        }
        subtitle={
          editingClient
            ? 'Update client information'
            : 'Create a new client'
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
              form="client-form"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : editingClient
                  ? 'Save changes'
                  : 'Add client'}
            </button>
          </>
        }
      >
        <form
          id="client-form"
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="client-name">
                Name
              </label>

              <input
                id="client-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Client name"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="client-company">
                Company
              </label>

              <input
                id="client-company"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Company name"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="client-email">
                Email
              </label>

              <input
                id="client-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="client@example.com"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="client-phone">
                Phone
              </label>

              <input
                id="client-phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+234..."
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="client-website">
                Website
              </label>

              <input
                id="client-website"
                name="website"
                type="url"
                value={form.website}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="client-status-form">
                Status
              </label>

              <select
                id="client-status-form"
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                <option value="Prospect">
                  Prospect
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="At Risk">
                  At Risk
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="client-notes">
                Notes
              </label>

              <textarea
                id="client-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add notes about this client..."
                rows={4}
              />
            </div>
          </div>
        </form>
      </Modal>

      <Toast
        title="Clients"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}