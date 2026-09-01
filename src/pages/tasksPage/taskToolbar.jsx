import { Plus, MagnifyingGlass } from '@phosphor-icons/react'

import styles from './taskToolbar.module.css'

export default function TaskToolbar({ search, onSearchChange, filter, onFilterChange, sort, onSortChange, viewMode, onViewChange, onCreate }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.controls}>
        <label className={styles.searchWrap}>
          <span className={styles.srOnly}>Search tasks</span>
          <MagnifyingGlass className={styles.searchIcon} size={16} weight="bold" aria-hidden="true" />
          <input
            className={styles.search}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
          />
        </label>

        <select className={styles.select} value={filter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Filter by priority">
          <option value="All">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select className={styles.select} value={sort} onChange={(event) => onSortChange(event.target.value)} aria-label="Sort tasks">
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div className={styles.actions}>
        <div className={styles.toggleGroup} role="tablist" aria-label="Task-view toggle">
          <button className={viewMode === 'board' ? styles.active : ''} type="button" onClick={() => onViewChange('board')}>
            Board
          </button>
          <button className={viewMode === 'list' ? styles.active : ''} type="button" onClick={() => onViewChange('list')}>
            List
          </button>
        </div>

        <button className="primary-btn" type="button" onClick={onCreate}>

          <Plus size={15} weight="bold" aria-hidden="true" />

          New Task
        </button>
      </div>
    </div>
  )
}
