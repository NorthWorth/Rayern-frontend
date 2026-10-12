import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarBlank,
  CheckSquare,
  Package,
  Clock,
  ArrowRight,
  Check,
  WarningCircle,
  CalendarCheck,
} from '@phosphor-icons/react'
import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'
import api from '../../api/apiClient.js'
import styles from './actionCenterPage.module.css'

function formatDateShort(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getCategoryIcon(kind) {
  switch (kind) {
    case 'Overdue task':
    case 'Task due today':
    case 'Task due soon':
      return CheckSquare
    case 'Changes requested':
      return WarningCircle
    case 'Awaiting review':
    case 'In review':
    case 'Waiting for review':
      return Package
    case 'Upcoming meeting':
      return CalendarBlank
    case 'Deadline approaching':
      return Clock
    default:
      return ArrowRight
  }
}

function getCategoryTone(kind) {
  if (kind === 'Overdue task' || kind === 'Changes requested') return 'inactive'
  if (kind === 'Awaiting review' || kind === 'In review' || kind === 'Waiting for review') return 'lead'
  return 'active'
}

const EMPTY = { needsAttention: [], waitingOnOthers: [], comingUp: [] }

export default function ActionCenterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(EMPTY)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const result = await api.get('/action-center')
        if (!cancelled) setData(result || EMPTY)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Unable to load action center.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const openItem = (item) => {
    if (item.href) navigate(item.href)
  }

  const totalCount =
    (data?.needsAttention?.length || 0) +
    (data?.waitingOnOthers?.length || 0) +
    (data?.comingUp?.length || 0)

  const renderItems = (items, defaultEmptyTitle, defaultEmptyDesc) => {
    if (items.length === 0) {
      return (
        <div className={styles.emptyBucket}>
          <EmptyState
            title={defaultEmptyTitle}
            description={defaultEmptyDesc}
          />
        </div>
      )
    }
    return (
      <ul className={styles.itemList}>
        {items.map((item) => {
          const Icon = getCategoryIcon(item.kind)
          return (
            <li key={item.kind + '|' + item.id} className={styles.item}>
              <button
                className={styles.itemButton}
                type="button"
                onClick={() => openItem(item)}
                disabled={!item.href}
              >
                <span className={styles.itemIcon} aria-hidden="true">
                  <Icon size={18} weight="duotone" />
                </span>
                <span className={styles.itemBody}>
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemMeta}>
                    <Badge tone={getCategoryTone(item.kind)}>{item.kind}</Badge>
                    {item.status && item.status !== item.kind && (
                      <span className={styles.itemStatus}>{item.status}</span>
                    )}
                  </span>
                  <span className={styles.itemReason}>{item.detail}</span>
                  {(item.dueDate || item.date) && (
                    <span className={styles.itemDate}>
                      <CalendarCheck size={12} weight="bold" aria-hidden="true" />
                      {item.dueDate ? 'Due ' + formatDateShort(item.dueDate) : 'On ' + formatDateShort(item.date)}
                    </span>
                  )}
                </span>
                <span className={styles.itemChevron} aria-hidden="true">
                  <ArrowRight size={14} weight="bold" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <PageLayout
      title="Action Center"
      subtitle="What needs your attention"
      actions={
        <button className="ghost-btn" type="button" onClick={() => navigate('/dashboard')}>
          <ArrowRight size={15} weight="bold" aria-hidden="true" />
          Back to dashboard
        </button>
      }
    >
      <PageSection eyebrow="Your work" title="One place for outstanding client work">
        {isLoading ? (
          <div className={styles.loading}>
            <EmptyState title="Loading action center..." description="Fetching your outstanding work." />
          </div>
        ) : error ? (
          <div className={styles.error} role="alert">
            <WarningCircle size={20} weight="duotone" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : totalCount === 0 ? (
          <div className={styles.allClear}>
            <Check size={28} weight="bold" aria-hidden="true" />
            <div>
              <h3>All caught up</h3>
              <p>Nothing needs your attention right now. Check back later or review your dashboards.</p>
            </div>
          </div>
        ) : (
          <div className={styles.sections}>
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionEyebrow}>Action required</span>
                <h3>Needs attention</h3>
                <span className={styles.sectionCount}>{data.needsAttention.length}</span>
              </div>
              <p className={styles.sectionDesc}>
                Overdue tasks, deliverables with changes requested, items awaiting your review, and upcoming meetings.
              </p>
              {renderItems(
                data.needsAttention,
                'Nothing needs your attention right now',
                'All tasks, deliverables, and meetings are on track.',
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionEyebrow}>Depends on others</span>
                <h3>Waiting on others</h3>
                <span className={styles.sectionCount}>{data.waitingOnOthers.length}</span>
              </div>
              <p className={styles.sectionDesc}>
                Work where progress depends on a review, client feedback, or external approval.
              </p>
              {renderItems(
                data.waitingOnOthers,
                'Nothing is waiting on others',
                'All submitted work is being handled.',
              )}
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionEyebrow}>Upcoming</span>
                <h3>Coming up</h3>
                <span className={styles.sectionCount}>{data.comingUp.length}</span>
              </div>
              <p className={styles.sectionDesc}>
                Tasks due soon, deliverables approaching deadlines, and scheduled meetings.
              </p>
              {renderItems(
                data.comingUp,
                'Nothing coming up',
                'No tasks, deliverables, or meetings are approaching.',
              )}
            </section>
          </div>
        )}
      </PageSection>
    </PageLayout>
  )
}
