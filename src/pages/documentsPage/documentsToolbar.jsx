import { Plus, MagnifyingGlass } from '@phosphor-icons/react'

import styles from './documentsToolbar.module.css'

export default function DocumentsToolbar({ search, onSearchChange, typeFilter, onTypeFilterChange, viewMode, onViewModeChange, onUpload }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.controls}>
        <label className={styles.searchWrap}>
          <span className={styles.srOnly}>Search documents</span>
          <MagnifyingGlass className={styles.searchIcon} size={16} weight="bold" aria-hidden="true" />
          <input
            className={styles.search}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
          />
        </label>

        <select className={styles.select} value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value)} aria-label="Filter by document type">
          <option value="All">All types</option>
          <option value="PDF">PDF</option>
          <option value="PPT">PPT</option>
          <option value="DOC">Docs</option>
          <option value="XLS">Spreadsheets</option>
          <option value="IMG">Images</option>
          <option value="ZIP">Archives</option>
        </select>
      </div>

      <div className={styles.actions}>
        <div className={styles.toggleGroup} role="tablist" aria-label="Document view switcher">
          <button className={viewMode === 'grid' ? styles.active : ''} type="button" onClick={() => onViewModeChange('grid')}>
            Grid
          </button>
          <button className={viewMode === 'list' ? styles.active : ''} type="button" onClick={() => onViewModeChange('list')}>
            List
          </button>
        </div>

        <button className="primary-btn" type="button" onClick={onUpload}>

          <Plus size={15} weight="bold" aria-hidden="true" />

          Upload
        </button>
      </div>
    </div>
  )
}
