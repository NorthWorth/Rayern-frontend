import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  Plus,
  Package,
  DotsThree,
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
import Dropdown from '../../components/ui/dropdown/dropdown.jsx'
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
  if (status === 'Approved' || status === 'Completed') {
    return 'active'
  }
  if (status === 'Changes Requested') {
    return 'inactive'
  }
  return 'lead'
}

function getImagesFor(item) {
  if (Array.isArray(item.images)) {
    return item.images
  }
  if (item.previewImage?.secureUrl) {
    return [item.previewImage]
  }
  return []
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
    createReviewAccess,
    uploadPreviewImage,
    removePreviewImage,
  } = useDeliverables()

  const { projects } = useProjects()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchParams, setSearchParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(() => searchParams.get('create') === '1')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [previewImageFile, setPreviewImageFile] = useState(null)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [removingImageIds, setRemovingImageIds] = useState(new Set())
  const fileInputRef = useRef(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [rotateArmedId, setRotateArmedId] = useState(null)

  useEffect(() => {
    if (!error) return
    setToastMessage(error)
  }, [error])

  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('create')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Options menu: closes on outside click and on Escape.
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target?.closest?.('[data-menu-root]')) {
        setOpenMenuId(null)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const getProjectIdOf = (item) =>
    typeof item.project === 'object'
      ? item.project?._id ?? item.project?.id
      : item.project

  const visibleDeliverables = useMemo(() => {
    const query = search.trim().toLowerCase()
    return deliverables.filter((item) => {
      const projectName = typeof item.project === 'object' ? item.project?.name ?? '' : ''
      const clientName = typeof item.project === 'object' && typeof item.project?.client === 'object' ? item.project.client?.name ?? '' : ''
      const searchableText = [item.title, item.description, projectName, clientName].filter(Boolean).join(' ').toLowerCase()
      return (!query || searchableText.includes(query)) && (statusFilter === 'All' || item.status === statusFilter)
    })
  }, [deliverables, search, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, projectId: projects[0]?._id ?? projects[0]?.id ?? '' })
    setFormErrors({})
    setPreviewImageFile(null)
    setPreviewImageUrl(null)
    setIsModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      title: item.title ?? '',
      projectId: getProjectIdOf(item) ?? '',
      dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : '',
      description: item.description ?? '',
    })
    setFormErrors({})
    setPreviewImageFile(null)
    setPreviewImageUrl(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setPreviewImageFile(null)
    setPreviewImageUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((currentErrors) => {
      if (!currentErrors[name]) return currentErrors
      const next = { ...currentErrors }
      delete next[name]
      return next
    })
  }

  const validateForm = (values) => {
    const nextErrors = {}
    if (!values.title.trim()) nextErrors.title = 'Deliverable name is required.'
    if (!values.projectId) nextErrors.projectId = 'Project is required.'
    return nextErrors
  }

  const handlePreviewImageSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setToastMessage('Image must be under 5 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setToastMessage('Only JPEG, PNG, WebP, and GIF images are allowed.')
      return
    }
    setPreviewImageFile(file)
    setPreviewImageUrl(URL.createObjectURL(file))
  }

  const handleRemoveExistingImage = async (item, imagePublicId) => {
    if (!imagePublicId) return
    setRemovingImageIds((prev) => new Set(prev).add(imagePublicId))
    try {
      await removePreviewImage(item._id ?? item.id, imagePublicId)
    } catch {
      // Removal failed — the image stays attached and
      // the list re-renders from server state.
    }
    finally {
      setRemovingImageIds((prev) => { const n = new Set(prev); n.delete(imagePublicId); return n })
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    const nextErrors = validateForm(form)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setIsSaving(true)
    try {
      let savedItem = null
      if (editing) {
        savedItem = await updateDeliverable(editing._id ?? editing.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          dueDate: form.dueDate || null,
        })
        setToastMessage('Deliverable updated')
      } else {
        savedItem = await addDeliverable({
          title: form.title.trim(),
          project: form.projectId,
          description: form.description.trim(),
          dueDate: form.dueDate || null,
        })
        setToastMessage('Deliverable created')
      }
      if (previewImageFile && savedItem?._id) {
        try {
          await uploadPreviewImage(savedItem._id, previewImageFile)
        } catch {
          // The deliverable itself saved successfully;
          // the user can add the image again from edit.
        }
      }
      closeModal()
    } catch (requestError) {
      setToastMessage(requestError?.message || 'Failed to save the deliverable.')
    } finally {
      setIsSaving(false)
    }
  }

  const getClientName = (item) => {
    if (typeof item.project === 'object' && typeof item.project?.client === 'object') {
      return item.project.client?.name ?? item.project.client?.company ?? 'Unknown client'
    }
    return 'Unassigned client'
  }

  const getProjectName = (item) => {
    if (typeof item.project === 'object') return item.project?.name ?? ''
    const m = projects.find((p) => (p._id ?? p.id) === item.project)
    return m?.name ?? ''
  }

  const copyReviewLink = async (item) => {
    const itemId = item._id ?? item.id
    if (!itemId) { setToastMessage('Unable to create review link.'); return }
    if (item.status === 'Draft') { setToastMessage('Submit the deliverable for review first.'); return }

    // Review tokens are stored hash-only, so an existing active link
    // cannot be shown again. Require a second click to replace it.
    const rotate = rotateArmedId === itemId

    try {
      const data = await createReviewAccess(itemId, undefined, { rotate })

      if (!rotate && data?.active && !data?.reviewUrl) {
        setRotateArmedId(itemId)
        setToastMessage('A review link is already active. Click Copy again to replace it — the previous link will stop working.')
        return
      }

      const reviewUrl = data?.reviewUrl
      if (!reviewUrl) throw new Error('No review link returned.')
      await navigator.clipboard.writeText(reviewUrl)
      setRotateArmedId(null)
      setToastMessage('Client review link copied')
    } catch (e) {
      setToastMessage(e?.message || 'Unable to create review link.')
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await deleteDeliverable(toDelete._id ?? toDelete.id)
      setToastMessage('Deliverable deleted')
    } catch (e) {
      setToastMessage(e?.message || 'Failed to delete the deliverable.')
    } finally {
      setToDelete(null)
    }
  }

  const handleSubmitForReview = async (item) => {
    try {
      await submitForReview(item._id ?? item.id)
      setToastMessage(item.status === 'Changes Requested' ? 'Revision submitted for review' : 'Deliverable submitted for review')
    } catch (e) {
      setToastMessage(e?.message || 'Failed to submit for review.')
    }
  }

  const canSubmit = (item) => item.status === 'Draft' || item.status === 'Changes Requested'

  const toggleMenu = (itemId) => {
    setOpenMenuId((current) => (current === itemId ? null : itemId))
  }

  return (
    <PageLayout
      title="Deliverables"
      subtitle="Review workflow"
      actions={
        <button className="primary-btn" type="button" onClick={openCreate}>
          <Plus size={15} weight="bold" aria-hidden="true" />
          New Deliverable
        </button>
      }
    >
      <PageSection eyebrow="Delivery workspace" title="Manage client deliverables">
        <div className={styles.toolbar}>
          <Input leadingIcon={MagnifyingGlass} label="Search deliverables" name="search" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, project, or client" />
          <Select label="Status" name="status" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statuses.map((s) => ({ value: s, label: s }))} />
        </div>
        <div className={styles.statusFilters}>
          {statuses.map((status) => (
            <button key={status} type="button"
              className={statusFilter === status ? styles.filterChipActive : styles.filterChip}
              onClick={() => setStatusFilter(status)}>{status}</button>
          ))}
        </div>
        {error && !isLoading && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c' }}>{error}</div>
        )}
        {isLoading ? (
          <div className={styles.list}><EmptyState title="Loading deliverables..." description="Fetching your delivery workspace." /></div>
        ) : visibleDeliverables.length === 0 ? (
          <div className={styles.emptyState}>
            <EmptyState title="No deliverables found"
              description={search || statusFilter !== 'All' ? 'Try adjusting your search or status filter.' : 'Create your first deliverable to start the review workflow.'}
              actionLabel={projects.length > 0 ? 'New Deliverable' : undefined}
              onAction={projects.length > 0 ? openCreate : undefined} />
            {projects.length === 0 && <p style={{ marginTop: '8px', color: '#64748b', fontSize: '0.85rem' }}>You need at least one project before creating a deliverable.</p>}
          </div>
        ) : (
          <div className={styles.list}>
            {visibleDeliverables.map((item) => {
              const itemId = item._id ?? item.id
              const itemImages = getImagesFor(item)
              const isMenuOpen = openMenuId === itemId
              return (
                <article className={styles.card} key={itemId}>
                  <div className={styles.cardIcon}><Package size={20} weight="duotone" aria-hidden="true" /></div>
                  {itemImages.length > 0 && (
                    <div className={styles.imageStrip}>
                      {itemImages.map((img, index) => (
                        <div key={img.publicId || 'img-' + index} className={styles.imageThumb}>
                          <img src={img.secureUrl || ''} alt="" loading="lazy" />
                          <button className={styles.removeImageThumb} type="button" aria-label="Remove image"
                            onClick={() => handleRemoveExistingImage(item, img.publicId)}>
                            <X size={12} weight="bold" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.cardMain}>
                    <div className={styles.titleBlock}>
                      <h3>{item.title}</h3>
                      <div className={styles.clientProject}>
                        <span>{getProjectName(item)}</span>
                        <span aria-hidden="true">•</span>
                        <strong>{getClientName(item)}</strong>
                      </div>
                    </div>
                    <p className={styles.description}>{item.description || 'No description provided.'}</p>
                    <div className={styles.metadata}>
                      <span>Due {item.dueDate ? String(item.dueDate).slice(0, 10) : 'TBD'}</span>
                      {item.submittedAt && <span>Submitted {String(item.submittedAt).slice(0, 10)}</span>}
                      {item.reviewedAt && <span>Reviewed {String(item.reviewedAt).slice(0, 10)}</span>}
                    </div>
                  </div>
                  <div className={styles.menuAnchor} data-menu-root>
                    <Dropdown
                      open={isMenuOpen}
                      onClose={() => setOpenMenuId(null)}
                      anchorLabel={'Options for ' + item.title}
                      items={() => {
                        const items = []
                        items.push({ label: 'Review', onSelect: () => { window.location.href = '/review/' + itemId } })
                        if (item.status !== 'Draft') items.push({ label: 'Copy client review link', onSelect: () => copyReviewLink(item) })
                        items.push({ label: 'Edit deliverable', onSelect: () => openEdit(item) })
                        if (canSubmit(item)) items.push({ label: item.status === 'Changes Requested' ? 'Resubmit for review' : 'Submit for review', onSelect: () => handleSubmitForReview(item) })
                        items.push({ label: 'Delete deliverable', onSelect: () => { setToDelete(item) } })
                        return items
                      }}
                      align="right"
                    />
                    <button className={styles.menuButton} type="button"
                      aria-label={'Open options for ' + item.title}
                      aria-haspopup="true"
                      onClick={() => toggleMenu(itemId)}>
                      <DotsThree size={20} weight="bold" aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.statusPosition}>
                    <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </PageSection>
      <Modal open={isModalOpen} onClose={closeModal}
        title={editing ? 'Edit deliverable' : 'Create deliverable'}
        subtitle="Delivery details"
        footer={
          <>
            <button className="ghost-btn" type="button" onClick={closeModal} disabled={isSaving}>Cancel</button>
            <button className="primary-btn" type="submit" form="deliverable-form" disabled={isSaving}>
              {isSaving ? 'Saving...' : editing ? 'Save changes' : 'Save deliverable'}
            </button>
          </>
        }
      >
        <form id="deliverable-form" onSubmit={handleSave} className={styles.form} noValidate>
          <Input label="Deliverable name" name="title" value={form.title} onChange={handleChange}
            placeholder="Homepage design" error={formErrors.title} required autoFocus />
          {editing ? (
            <Select label="Project" name="projectId" value={getProjectIdOf(editing) ?? ''}
              onChange={handleChange}
              options={[{ value: getProjectIdOf(editing) ?? '', label: getProjectName(editing) || 'Current project' }]} disabled />
          ) : (
            <Select label="Project" name="projectId" value={form.projectId} onChange={handleChange}
              options={[
                { value: '', label: projects.length === 0 ? 'No projects available' : 'Select a project' },
                ...projects.map((p) => {
                  const cn = typeof p.client === 'object' ? p.client?.name ?? p.client?.company ?? '' : ''
                  return { value: p._id ?? p.id, label: cn ? p.name + ' — ' + cn : p.name }
                })
              ]}
              error={formErrors.projectId} disabled={projects.length === 0} required />
          )}
          <Input label="Due date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
          <Textarea label="Description" name="description" value={form.description} onChange={handleChange}
            placeholder="What is included in this delivery?" />
          <div className={styles.imageField}>
            <span className={styles.imageLabel}>Preview images</span>
            <p className={styles.imageHint}>Optional — add images to help your client recognize the project. You can add multiple.</p>
            {editing && (() => {
              const existing = getImagesFor(editing)
              if (existing.length === 0) return null
              return (
                <div className={styles.existingImages}>
                  {existing.map((img, i) => (
                    <div key={img.publicId || 'ex-' + i} className={styles.existingThumb}>
                      <img src={img.secureUrl || ''} alt="" loading="lazy" />
                      <button className={styles.removeExistingThumb} type="button" aria-label="Remove this image"
                        disabled={removingImageIds.has(img.publicId)}
                        onClick={() => handleRemoveExistingImage(editing, img.publicId)}>
                        <X size={12} weight="bold" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })()}
            <div className={styles.imageUploadArea}>
              {previewImageUrl ? (
                <div className={styles.imagePreview}>
                  <img src={previewImageUrl} alt="Preview" />
                  <button className={styles.removeImage} type="button"
                    onClick={() => { setPreviewImageFile(null); setPreviewImageUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                    <X size={14} weight="bold" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className={styles.imageUpload}>
                  <input ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePreviewImageSelect} className={styles.imageInput} />
                  <ImageIcon size={20} weight="duotone" aria-hidden="true" />
                  <span>Choose an image</span>
                  <small>JPEG, PNG, WebP, or GIF · Max 5 MB</small>
                </label>
              )}
            </div>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(toDelete)} title="Delete deliverable"
        message={'Delete "' + (toDelete?.title ?? '') + '"? This cannot be undone.'}
        onClose={() => setToDelete(null)} onConfirm={handleDelete} confirmLabel="Delete" />
      <Toast title="Deliverables" message={toastMessage} visible={Boolean(toastMessage)}
        onClose={() => setToastMessage('')} />
    </PageLayout>
  )
}
