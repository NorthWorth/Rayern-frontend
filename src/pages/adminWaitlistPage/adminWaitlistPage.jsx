import { useEffect, useState } from 'react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import EmptyState from '../../components/ui/emptyState/emptyState.jsx'
import Badge from '../../components/ui/badge/badge.jsx'

import api from '../../api/apiClient.js'

import styles from './adminWaitlistPage.module.css'

function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminWaitlistPage() {
  const [signups, setSignups] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadToken, setReloadToken] =
    useState(0)

  useEffect(() => {
    let isActive = true

    const fetchWaitlist = async () => {
      try {
        const response = await api.get(
          '/admin/waitlist',
        )

        if (!isActive) {
          return
        }

        const result =
          response?.data || response

        setSignups(
          Array.isArray(result?.signups)
            ? result.signups
            : [],
        )

        setTotal(result?.total ?? 0)

        setError('')
      } catch (loadError) {
        if (!isActive) {
          return
        }

        setError(
          loadError?.message ||
            'Unable to load waitlist signups.',
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    fetchWaitlist()

    return () => {
      isActive = false
    }
  }, [reloadToken])

  const verifiedCount = signups.filter(
    (signup) => signup.verified,
  ).length

  const handleRetry = () => {
    setError('')
    setIsLoading(true)
    setReloadToken((token) => token + 1)
  }

  return (
    <PageLayout
      title="Waitlist"
      subtitle="Admin"
    >
      <PageSection>
        <div className={styles.page}>

          <section className={styles.stats}>
            <article className="stat-card">
              <p className="stat-card__label">
                Total signups
              </p>

              <strong className="stat-card__value">
                {isLoading ? '…' : total}
              </strong>

              <span className="stat-card__delta">
                All waitlist entries
              </span>
            </article>

            <article className="stat-card">
              <p className="stat-card__label">
                Verified emails
              </p>

              <strong className="stat-card__value">
                {isLoading
                  ? '…'
                  : verifiedCount}
              </strong>

              <span className="stat-card__delta">
                Confirmed their address
              </span>
            </article>
          </section>

          <section className={styles.listPanel}>
            {error ? (
              <div
                className={styles.error}
                role="alert"
              >
                <p>{error}</p>

                <button
                  className="ghost-btn"
                  type="button"
                  onClick={handleRetry}
                  disabled={isLoading}
                >
                  Try again
                </button>
              </div>
            ) : isLoading ? (
              <div
                className={styles.loading}
                role="status"
              >
                Loading waitlist…
              </div>
            ) : signups.length === 0 ? (
              <EmptyState
                title="No signups yet"
                description="When people join the Rayern waitlist, they will appear here."
              />
            ) : (
              <>
                <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                  <span>Email</span>
                  <span>Status</span>
                  <span>Joined</span>
                </div>

                <div className={styles.tableBody}>
                  {signups.map((signup) => (
                    <div
                      className={
                        styles.tableRow
                      }
                      key={
                        signup.email ||
                        signup._id
                      }
                    >
                      <strong>
                        {signup.email}
                      </strong>

                      <Badge
                        tone={
                          signup.verified
                            ? 'active'
                            : 'prospect'
                        }
                      >
                        {signup.verified
                          ? 'Verified'
                          : 'Pending'}
                      </Badge>

                      <span>
                        {formatDateTime(
                          signup.joinedAt ||
                            signup.createdAt,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

        </div>
      </PageSection>
    </PageLayout>
  )
}
