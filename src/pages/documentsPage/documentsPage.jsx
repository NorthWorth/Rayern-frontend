import { useEffect, useMemo, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { useSearchParams } from 'react-router-dom'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import PageTable from '../../components/ui/pageTable/pageTable.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import ConfirmDialog from '../../components/ui/confirmDialog/confirmDialog.jsx'
import UploadZone from './uploadZone.jsx'
import DocumentsToolbar from './documentsToolbar.jsx'
import DocumentCard from './documentCard.jsx'
import StorageMeter from './storageMeter.jsx'
import { useDocuments } from '../../context/documentContext.jsx'
import { formatFileSize } from '../../utils/format.js'
import styles from './documentsPage.module.css'

function formatUpdated(dateString) {
  const parsed = new Date(dateString)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function toCardModel(document) {
  return {
    id: document._id,
    title: document.title,
    type: document.type,
    owner: 'You',
    updated: formatUpdated(document.createdAt),
    size: formatFileSize(document.size),
    raw: document,
  }
}

export default function DocumentsPage() {
  const {
    documents,
    isLoading,
    error,
    storage,
    fetchDocuments,
    uploadDocument,
    renameDocument,
    deleteDocument,
    downloadDocument,
    clearError,
  } = useDocuments()

  const [searchParams, setSearchParams] =
    useSearchParams()

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(
    () => searchParams.get('upload') === '1',
  )
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [renamedTitle, setRenamedTitle] = useState('')
  const [actionError, setActionError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (searchParams.get('upload') !== '1') {
      return
    }

    const nextParams = new URLSearchParams(
      searchParams,
    )

    nextParams.delete('upload')

    setSearchParams(nextParams, {
      replace: true,
    })
  }, [searchParams, setSearchParams])

  const cardModels = useMemo(
    () => documents.map(toCardModel),
    [documents],
  )

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return cardModels.filter((document) => {
      const matchesSearch =
        !normalizedSearch ||
        [document.title, document.type].join(' ').toLowerCase().includes(normalizedSearch)

      const matchesType = typeFilter === 'All' || document.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [cardModels, search, typeFilter])

  const recentUploads = cardModels.slice(0, 3)

  const openUploadModal = () => setIsUploadModalOpen(true)

  const onFilesSelected = async (fileList) => {
    const files = Array.from(fileList || [])

    if (files.length === 0) {
      return
    }

    setActionError('')
    setIsUploading(true)

    try {
      for (const file of files) {
        await uploadDocument(file)
      }

      setIsUploadModalOpen(false)
    } catch (uploadError) {
      setActionError(
        uploadError.message ||
          'One or more files could not be uploaded.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreview = (document) => {
    setSelectedDocument(document)
    setIsPreviewModalOpen(true)
  }

  const handleDownload = async (document) => {
    setActionError('')

    try {
      await downloadDocument(document.raw ?? document)
    } catch (downloadError) {
      setActionError(
        downloadError.message ||
          'The file could not be downloaded.',
      )
    }
  }

  const handleRenameOpen = (document) => {
    setSelectedDocument(document)
    setRenamedTitle(document.title)
    setIsRenameModalOpen(true)
  }

  const handleRenameSubmit = async (event) => {
    event.preventDefault()

    if (!selectedDocument || !renamedTitle.trim()) {
      return
    }

    setActionError('')

    try {
      await renameDocument(selectedDocument.id, renamedTitle.trim())
      setIsRenameModalOpen(false)
      setSelectedDocument(null)
    } catch (renameError) {
      setActionError(
        renameError.message ||
          'The document could not be renamed.',
      )
    }
  }

  const handleDeleteOpen = (document) => {
    setSelectedDocument(document)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) {
      return
    }

    setActionError('')

    try {
      await deleteDocument(selectedDocument.id)
      setIsDeleteDialogOpen(false)
      setSelectedDocument(null)
    } catch (deleteError) {
      setActionError(
        deleteError.message ||
          'The document could not be deleted.',
      )
    }
  }

  if (isLoading && documents.length === 0 && !error) {
    return (
      <PageLayout title="Document Center" subtitle="Files & records" actions={<button className="primary-btn" type="button">+ Upload</button>}>
        <PageSection eyebrow="Repository" title="Shared client materials">
          <div className={styles.loadingPanel}>
            {Array.from({ length: 3 }, (_, index) => (
              <div className={styles.loadingCard} key={index}>
                <div className={`${styles.loadingLine} ${styles.loadingLineWide}`} />
                <div className={`${styles.loadingLine} ${styles.loadingLineMedium}`} />
                <div className={`${styles.loadingLine} ${styles.loadingLineShort}`} />
              </div>
            ))}
          </div>
        </PageSection>
      </PageLayout>
    )
  }

  const renderError = error || actionError

  return (
    <PageLayout
      title="Document Center"
      subtitle="Files & records"
      actions={
        <button className="primary-btn" type="button" onClick={openUploadModal}>

          <Plus size={15} weight="bold" aria-hidden="true" />

          Upload
        </button>
      }
    >
      <PageSection eyebrow="Repository" title="Shared client materials">
        <DocumentsToolbar
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUpload={openUploadModal}
        />

        <StorageMeter storage={storage} />

        {renderError ? (
          <p role="alert" style={{ margin: '8px 0 0' }}>
            {renderError}{' '}
            {error ? (
              <button className="ghost-btn" type="button" onClick={() => { clearError(); fetchDocuments() }}>
                Retry
              </button>
            ) : (
              <button className="ghost-btn" type="button" onClick={() => setActionError('')}>
                Dismiss
              </button>
            )}
          </p>
        ) : null}

        {viewMode === 'grid' ? (
          <div className={styles.gridLayout}>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onRename={handleRenameOpen}
                  onDelete={handleDeleteOpen}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                <strong>No documents found</strong>
                <p>Try clearing the search or uploading a new file.</p>
              </div>
            )}
          </div>
        ) : (
          <PageTable columns={['Document', 'Type', 'Owner', 'Updated', 'Actions']}>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => (
                <div className="table-row" key={document.id}>
                  <strong>{document.title}</strong>
                  <span>{document.type}</span>
                  <span>{document.owner}</span>
                  <span>{document.updated}</span>
                  <span>
                    <button className="ghost-btn" type="button" onClick={() => handlePreview(document)}>
                      Preview
                    </button>{' '}
                    <button className="ghost-btn" type="button" onClick={() => handleDownload(document)}>
                      Download
                    </button>{' '}
                    <button className="ghost-btn" type="button" onClick={() => handleRenameOpen(document)}>
                      Rename
                    </button>{' '}
                    <button className="ghost-btn" type="button" onClick={() => handleDeleteOpen(document)}>
                      Delete
                    </button>
                  </span>
                </div>
              ))
            ) : (
              <div className="table-row">
                <span>No matching documents</span>
              </div>
            )}
          </PageTable>
        )}
      </PageSection>

      <PageSection eyebrow="Recent" title="Recent uploads">
        <div className={styles.gridLayout}>
          {recentUploads.map((document) => (
            <DocumentCard
              key={`recent-${document.id}`}
              document={document}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onRename={handleRenameOpen}
              onDelete={handleDeleteOpen}
            />
          ))}
        </div>
      </PageSection>

      <Modal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Add documents"
        subtitle="Upload"
      >
        <UploadZone onFilesSelected={onFilesSelected} isBusy={isUploading} />

        {actionError ? (
          <p role="alert" style={{ marginTop: 8 }}>
            {actionError}
          </p>
        ) : null}
      </Modal>

      <Modal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={selectedDocument?.title ?? 'Preview'}
        subtitle="Preview"
        footer={
          <>
            <button className="ghost-btn" type="button" onClick={() => handleDownload(selectedDocument)}>
              Download
            </button>
            <button className="primary-btn" type="button" onClick={() => setIsPreviewModalOpen(false)}>
              Close
            </button>
          </>
        }
      >
        {selectedDocument ? (
          <div className={styles.previewMeta}>
            <div className={styles.previewTile}>{selectedDocument.type}</div>
            <strong>{selectedDocument.title}</strong>
            <span>Owner: {selectedDocument.owner}</span>
            <span>Uploaded: {selectedDocument.updated}</span>
            <span>Size: {formatFileSize(selectedDocument.raw?.size)}</span>
            <span>Type: {selectedDocument.raw?.mimeType ?? selectedDocument.type}</span>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename document"
        subtitle="Update metadata"
        footer={
          <>
            <button className="ghost-btn" type="button" onClick={() => setIsRenameModalOpen(false)}>
              Cancel
            </button>
            <button className="primary-btn" type="button" onClick={handleRenameSubmit}>
              Save
            </button>
          </>
        }
      >
        <label className={styles.previewMeta}>
          <span>Document title</span>
          <input
            type="text"
            value={renamedTitle}
            onChange={(event) => setRenamedTitle(event.target.value)}
            aria-label="Rename document"
          />
        </label>
      </Modal>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Delete document"
        message={`Delete ${selectedDocument?.title ?? 'this document'} from the workspace?`}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </PageLayout>
  )
}
