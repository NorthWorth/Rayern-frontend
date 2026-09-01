import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import {
  ArrowUpRight,
  Check,
  Plus,
  Package,
  DotsThree,
  ArrowRight,
  MagnifyingGlass,
  X,
  Image as ImageIcon,
} from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import ConfirmDialog from '../../components/ui/confirmDialog/confirmDialog.jsx'
import Input from '../../components/forms/input.jsx'
import Select from '../../components/forms/select.jsx'
import Textarea from '../../components/forms/textarea.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import { useDeliverables } from '../../context/deliverableContext.jsx'
import { useProjects } from '../../context/projectContext.jsx'

import styles from './deliverablesPage.module.css'

const statuses = [
  'All',
  'Draft',
  'Ready for Review',
  'In Review',
  'Changes Requested',
  'Approved',
]

const EMPTY_FORM = {
  title: '',
  projectId: '',
  dueDate: '',
  description: '',
}

function getStatusTone(status) {
  if (
    status === 'Approved' ||
    status === 'Completed'
  ) {
    return 'active'
  }

  if (status === 'Changes Requested') {
    return 'inactive'
  }

  return 'lead'
}

export default function DeliverablesPage() {
  const {
    deliverables,
    isLoading,
    error,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    submitForReview,
    approveDeliverable,
    createReviewAccess,
    uploadPreviewImage,
    removePreviewImage,
  } = useDeliverables()

  const { projects } = useProjects()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('All')

  const [searchParams, setSearchParams] =
    useSearchParams()

  const [isModalOpen, setIsModalOpen] =
    useState(
      () =>
        searchParams.get('create') === '1',
    )

  const [editing, setEditing] =
    useState(null)

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [formErrors, setFormErrors] =
    useState({})

  const [isSaving, setIsSaving] =
    useState(false)

  const [toDelete, setToDelete] =
    useState(null)

  const [openMenuId, setOpenMenuId] =
    useState(null)

  const [toastMessage, setToastMessage] =
    useState('')

  const [previewImageFile, setPreviewImageFile] =
    useState(null)

  const [previewImageUrl, setPreviewImageUrl] =
    useState(null)

  const fileInputRef = useRef(null)

  const menuRef = useRef(null)

  useEffect(() => {
    if (!error) {
      return
    }

    setToastMessage(error)
  }, [error])

  useEffect(() => {
    if (
      searchParams.get('create') !== '1'
    ) {
      return
    }

    const nextParams =
      new URLSearchParams(searchParams)

    nextParams.delete('create')

    setSearchParams(nextParams, {
      replace: true,
    })
  }, [
    searchParams,
    setSearchParams,
  ])

  useEffect(() => {
    const handleOutsideClick = (
      event,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target,
        )
      ) {
        setOpenMenuId(null)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    document.addEventListener(
      'keydown',
      handleEscape,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )

      document.removeEventListener(
        'keydown',
        handleEscape,
      )
    }
  }, [])

  const getProjectIdOf = (item) =>
    typeof item.project === 'object'
      ? item.project?._id ??
        item.project?.id
      : item.project

  const visibleDeliverables =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase()

      return deliverables.filter(
        (item) => {
          const projectName =
            typeof item.project ===
            'object'
              ? item.project?.name ?? ''
              : ''

          const clientName =
            typeof item.project ===
              'object' &&
            typeof item.project?.client ===
              'object'
              ? item.project.client
                  ?.name ?? ''
              : ''

          const searchableText = [
            item.title,
            item.description,
            projectName,
            clientName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          const matchesSearch =
            !query ||
            searchableText.includes(query)

          const matchesStatus =
            statusFilter === 'All' ||
            item.status === statusFilter

          return (
            matchesSearch &&
            matchesStatus
          )
        },
      )
    }, [
      deliverables,
      search,
      statusFilter,
    ])

  const openCreate = () => {
    setEditing(null)

    setForm({
      ...EMPTY_FORM,
      projectId:
        projects[0]?._id ??
        projects[0]?.id ??
        '',
    })

    setFormErrors({})
    setPreviewImageFile(null)
    setPreviewImageUrl(null)
    setIsModalOpen(true)
    setOpenMenuId(null)
  }

  const openEdit = (item) => {
    setEditing(item)

    setForm({
      title: item.title ?? '',
      projectId:
        getProjectIdOf(item) ?? '',
      dueDate: item.dueDate
        ? String(item.dueDate).slice(
            0,
            10,
          )
        : '',
      description:
        item.description ?? '',
    })

    setFormErrors({})
    setPreviewImageFile(null)
    setPreviewImageUrl(
      item.previewImage?.secureUrl ?? null,
    )
    setIsModalOpen(true)
    setOpenMenuId(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setPreviewImageFile(null)
    setPreviewImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChange = (event) => {
    const { name, value } =
      event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setFormErrors(
      (currentErrors) => {
        if (!currentErrors[name]) {
          return currentErrors
        }

        const nextErrors = {
          ...currentErrors,
        }

        delete nextErrors[name]

        return nextErrors
      },
    )
  }

  const validateForm = (values) => {
    const nextErrors = {}

    if (!values.title.trim()) {
      nextErrors.title =
        'Deliverable name is required.'
    }

    if (!values.projectId) {
      nextErrors.projectId =
        'Project is required.'
    }

    return nextErrors
  }

  const handlePreviewImageSelect = (
    event,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    const MAX = 5 * 1024 * 1024

    if (file.size > MAX) {
      setToastMessage(
        'Image must be under 5 MB.',
      )
      return
    }

    const ALLOWED = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]

    if (!ALLOWED.includes(file.type)) {
      setToastMessage(
        'Only JPEG, PNG, WebP, and GIF images are allowed.',
      )
      return
    }

    setPreviewImageFile(file)
    setPreviewImageUrl(
      URL.createObjectURL(file),
    )
  }

  const handleRemovePreviewImage = async () => {
    // If we are editing and there was an
    // existing image, remove it from
    // the server.
    if (
      editing &&
      !previewImageFile &&
      previewImageUrl
    ) {
      try {
        await removePreviewImage(
          editing._id ?? editing.id,
        )
      } catch {
        // Non-fatal — the image reference
        // is cleared locally either way.
      }
    }

    setPreviewImageFile(null)
    setPreviewImageUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const nextErrors =
      validateForm(form)

    setFormErrors(nextErrors)

    if (
      Object.keys(nextErrors).length > 0
    ) {
      return
    }

    setIsSaving(true)

    try {
      let savedItem = null

      if (editing) {
        savedItem = await updateDeliverable(
          editing._id ?? editing.id,
          {
            title: form.title.trim(),
            description:
              form.description.trim(),
            dueDate:
              form.dueDate || null,
          },
        )

        setToastMessage(
          'Deliverable updated',
        )
      } else {
        savedItem = await addDeliverable({
          title: form.title.trim(),
          project: form.projectId,
          description:
            form.description.trim(),
          dueDate:
            form.dueDate || null,
        })

        setToastMessage(
          'Deliverable created',
        )
      }

      // Upload the preview image if one
      // was selected.
      if (
        previewImageFile &&
        savedItem?._id
      ) {
        try {
          await uploadPreviewImage(
            savedItem._id,
            previewImageFile,
          )
        } catch {
          // The deliverable was saved.
          // Image upload failure is
          // non-fatal — the user can
          // try again from the edit form.
        }
      }

      closeModal()
    } catch (requestError) {
      setToastMessage(
        requestError?.message ||
          'Failed to save the deliverable.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const getClientName = (item) => {
    if (
      typeof item.project ===
        'object' &&
      typeof item.project?.client ===
        'object'
    ) {
      return (
        item.project.client?.name ??
        item.project.client?.company ??
        'Unknown client'
      )
    }

    return 'Unassigned client'
  }

  const getProjectName = (item) => {
    if (
      typeof item.project ===
      'object'
    ) {
      return (
        item.project?.name ?? ''
      )
    }

    const matchingProject =
      projects.find(
        (project) =>
          (project._id ??
            project.id) ===
          item.project,
      )

    return (
      matchingProject?.name ?? ''
    )
  }

  const copyReviewLink = async (
    item,
  ) => {
    const itemId =
      item._id ?? item.id

    if (!itemId) {
      setToastMessage(
        'Unable to create review link.',
      )
      return
    }

    if (item.status === 'Draft') {
      setToastMessage(
        'Submit the deliverable for review before creating a review link.',
      )
      setOpenMenuId(null)
      return
    }

    try {
      const data =
        await createReviewAccess(
          itemId,
        )

      const reviewUrl =
        data?.reviewUrl

      if (!reviewUrl) {
        throw new Error(
          'The server did not return a review link.',
        )
      }

      await navigator.clipboard.writeText(
        reviewUrl,
      )

      setToastMessage(
        'Client review link copied',
      )
    } catch (requestError) {
      setToastMessage(
        requestError?.message ||
          'Unable to create review link.',
      )
    } finally {
      setOpenMenuId(null)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) {
      return
    }

    try {
      await deleteDeliverable(
        toDelete._id ??
          toDelete.id,
      )

      setToastMessage(
        'Deliverable deleted',
      )
    } catch (requestError) {
      setToastMessage(
        requestError?.message ||
          'Failed to delete the deliverable.',
      )
    } finally {
      setToDelete(null)
    }
  }

  const handleSubmitForReview =
    async (item) => {
      try {
        await submitForReview(
          item._id ?? item.id,
        )

        setToastMessage(
          item.status ===
            'Changes Requested'
            ? 'Revision submitted for review'
            : 'Deliverable submitted for review',
        )
      } catch (requestError) {
        setToastMessage(
          requestError?.message ||
            'Failed to submit for review.',
        )
      }

      setOpenMenuId(null)
    }

  const handleApprove = async (
    item,
  ) => {
    try {
      await approveDeliverable(
        item._id ?? item.id,
      )

      setToastMessage(
        'Deliverable approved',
      )
    } catch (requestError) {
      setToastMessage(
        requestError?.message ||
          'Failed to approve.',
      )
    }

    setOpenMenuId(null)
  }

  return (
    <PageLayout
      title="Deliverables"
      subtitle="Review workflow"
      actions={
        <button
          className="primary-btn"
          type="button"
          onClick={openCreate}
        >
          <Plus
            size={15}
            weight="bold"
            aria-hidden="true"
          />
          New Deliverable
        </button>
      }
    >
      <PageSection
        eyebrow="Delivery workspace"
        title="Manage client deliverables"
      >
        <div className={styles.toolbar}>
          <Input
            leadingIcon={MagnifyingGlass}
            label="Search deliverables"
            name="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search by title, project, or client"
          />

          <Select
            label="Status"
            name="status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            options={statuses.map(
              (status) => ({
                value: status,
                label: status,
              }),
            )}
          />
        </div>

        <div
          className={
            styles.statusFilters
          }
        >
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              className={
                statusFilter === status
                  ? styles.filterChipActive
                  : styles.filterChip
              }
              onClick={() =>
                setStatusFilter(status)
              }
            >
              {status}
            </button>
          ))}
        </div>

        {error && !isLoading && (
          <div
            role="alert"
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className={styles.list}>
            <EmptyState
              title="Loading deliverables..."
              description="Fetching your delivery workspace."
            />
          </div>
        ) : visibleDeliverables.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <EmptyState
              title="No deliverables found"
              description={
                search ||
                statusFilter !== 'All'
                  ? 'Try adjusting your search or status filter.'
                  : 'Create your first deliverable to start the review workflow.'
              }
              actionLabel={
                projects.length > 0
                  ? 'New Deliverable'
                  : undefined
              }
              onAction={
                projects.length > 0
                  ? openCreate
                  : undefined
              }
            />

            {projects.length === 0 && (
              <p
                style={{
                  marginTop: '8px',
                  color: '#64748b',
                  fontSize:
                    '0.85rem',
                }}
              >
                You need at least one
                project before creating
                a deliverable.
              </p>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {visibleDeliverables.map(
              (item) => {
                const itemId =
                  item._id ?? item.id

                const isMenuOpen =
                  openMenuId === itemId

                const canSubmit =
                  item.status ===
                    'Draft' ||
                  item.status ===
                    'Changes Requested'

                return (
                  <article
                    className={
                      styles.card
                    }
                    key={itemId}
                  >
                    <div
                      className={
                        styles.cardIcon
                      }
                    >
                      <Package
                        size={20}
                        weight="duotone"
                        aria-hidden="true"
                      />
                    </div>

                    <div
                      className={
                        styles.cardMain
                      }
                    >
                      <div
                        className={
                          styles.titleBlock
                        }
                      >
                        <h3>
                          {item.title}
                        </h3>

                        <div
                          className={
                            styles.clientProject
                          }
                        >
                          <span>
                            {getProjectName(
                              item,
                            )}
                          </span>

                          <span aria-hidden="true">
                            •
                          </span>

                          <strong>
                            {getClientName(
                              item,
                            )}
                          </strong>
                        </div>
                      </div>

                      <p
                        className={
                          styles.description
                        }
                      >
                        {item.description ||
                          'No description provided.'}
                      </p>

                      <div
                        className={
                          styles.metadata
                        }
                      >
                        <span>
                          Due{' '}
                          {item.dueDate
                            ? String(
                                item.dueDate,
                              ).slice(
                                0,
                                10,
                              )
                            : 'TBD'}
                        </span>

                        {item.submittedAt && (
                          <span>
                            Submitted{' '}
                            {String(
                              item.submittedAt,
                            ).slice(
                              0,
                              10,
                            )}
                          </span>
                        )}

                        {item.reviewedAt && (
                          <span>
                            Reviewed{' '}
                            {String(
                              item.reviewedAt,
                            ).slice(
                              0,
                              10,
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={
                        styles.menuWrap
                      }
                      ref={
                        isMenuOpen
                          ? menuRef
                          : null
                      }
                    >
                      <button
                        className={
                          styles.menuButton
                        }
                        type="button"
                        aria-label={`Open options for ${item.title}`}
                        aria-haspopup="menu"
                        aria-expanded={
                          isMenuOpen
                        }
                        onClick={() =>
                          setOpenMenuId(
                            isMenuOpen
                              ? null
                              : itemId,
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
                            styles.optionsMenu
                          }
                          role="menu"
                        >
                          <Link
                            className={
                              styles.menuItem
                            }
                            to={`/review/${itemId}`}
                            role="menuitem"
                            onClick={() =>
                              setOpenMenuId(
                                null,
                              )
                            }
                          >
                            <ArrowUpRight
                              size={14}
                              weight="bold"
                              aria-hidden="true"
                            />
                            Review
                          </Link>

                          <button
                            className={
                              styles.menuItem
                            }
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              copyReviewLink(
                                item,
                              )
                            }
                          >
                            <ArrowUpRight
                              size={14}
                              weight="bold"
                              aria-hidden="true"
                            />
                            Copy client review link
                          </button>

                          <button
                            className={
                              styles.menuItem
                            }
                            type="button"
                            role="menuitem"
                            onClick={() =>
                              openEdit(item)
                            }
                          >
                            <span>✎</span>
                            Edit
                          </button>

                          {canSubmit && (
                            <button
                              className={
                                styles.menuItem
                              }
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleSubmitForReview(
                                  item,
                                )
                              }
                            >
                              <ArrowRight
                                size={14}
                                weight="bold"
                                aria-hidden="true"
                              />
                              {item.status ===
                              'Changes Requested'
                                ? 'Resubmit for review'
                                : 'Submit for review'}
                            </button>
                          )}

                          {item.status ===
                            'In Review' && (
                            <button
                              className={
                                styles.menuItem
                              }
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                handleApprove(
                                  item,
                                )
                              }
                            >
                              <Check
                                size={14}
                                weight="bold"
                                aria-hidden="true"
                              />
                              Approve
                            </button>
                          )}

                          <button
                            className={`${styles.menuItem} ${styles.deleteItem}`}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setToDelete(
                                item,
                              )
                              setOpenMenuId(
                                null,
                              )
                            }}
                          >
                            <span>⌫</span>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={
                        styles.statusPosition
                      }
                    >
                      <Badge
                        tone={getStatusTone(
                          item.status,
                        )}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        )}
      </PageSection>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={
          editing
            ? 'Edit deliverable'
            : 'Create deliverable'
        }
        subtitle="Delivery details"
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
              form="deliverable-form"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : editing
                  ? 'Save changes'
                  : 'Save deliverable'}
            </button>
          </>
        }
      >
        <form
          id="deliverable-form"
          onSubmit={handleSave}
          className={styles.form}
          noValidate
        >
          <Input
            label="Deliverable name"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Homepage design"
            error={formErrors.title}
            required
            autoFocus
          />

          {editing ? (
            <Select
              label="Project"
              name="projectId"
              value={
                getProjectIdOf(
                  editing,
                ) ?? ''
              }
              onChange={handleChange}
              options={[
                {
                  value:
                    getProjectIdOf(
                      editing,
                    ) ?? '',
                  label:
                    getProjectName(
                      editing,
                    ) ||
                    'Current project',
                },
              ]}
              disabled
            />
          ) : (
            <Select
              label="Project"
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              options={[
                {
                  value: '',
                  label:
                    projects.length ===
                    0
                      ? 'No projects available'
                      : 'Select a project',
                },
                ...projects.map(
                  (project) => {
                    const clientName =
                      typeof project.client ===
                      'object'
                        ? project.client
                            ?.name ??
                          project.client
                            ?.company ??
                          ''
                        : ''

                    return {
                      value:
                        project._id ??
                        project.id,
                      label: clientName
                        ? `${project.name} — ${clientName}`
                        : project.name,
                    }
                  },
                ),
              ]}
              error={
                formErrors.projectId
              }
              disabled={
                projects.length === 0
              }
              required
            />
          )}

          <Input
            label="Due date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
          />

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What is included in this delivery?"
          />

          <div
            className={styles.imageField}
          >
            <span
              className={styles.imageLabel}
            >
              Project preview image
            </span>

            <p
              className={styles.imageHint}
            >
              Optional — add an image to
              help your client recognize
              the project.
            </p>

            {previewImageUrl ? (
              <div
                className={
                  styles.imagePreview
                }
              >
                <img
                  src={previewImageUrl}
                  alt="Preview"
                />

                <button
                  className={
                    styles.removeImage
                  }
                  type="button"
                  onClick={
                    handleRemovePreviewImage
                  }
                >
                  <X
                    size={14}
                    weight="bold"
                    aria-hidden="true"
                  />
                </button>
              </div>
            ) : (
              <label
                className={
                  styles.imageUpload
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    handlePreviewImageSelect
                  }
                  className={
                    styles.imageInput
                  }
                />

                <ImageIcon
                  size={20}
                  weight="duotone"
                  aria-hidden="true"
                />

                <span>
                  Choose an image
                </span>

                <small>
                  JPEG, PNG, WebP, or GIF
                  · Max 5 MB
                </small>
              </label>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete deliverable"
        message={`Delete “${toDelete?.title ?? ''}”? This cannot be undone.`}
        onClose={() =>
          setToDelete(null)
        }
        onConfirm={handleDelete}
        confirmLabel="Delete"
      />

      <Toast
        title="Deliverables"
        message={toastMessage}
        visible={Boolean(toastMessage)}
        onClose={() =>
          setToastMessage('')
        }
      />
    </PageLayout>
  )
}