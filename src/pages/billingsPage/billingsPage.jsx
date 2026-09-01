import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check } from '@phosphor-icons/react'

import PageLayout from '../../components/layout/pageLayout/pageLayout.jsx'
import PageSection from '../../components/ui/pageSection/pageSection.jsx'
import Badge from '../../components/ui/badge/badge.jsx'
import Modal from '../../components/ui/modal/modal.jsx'
import Toast from '../../components/ui/toast/toast.jsx'

import api from '../../api/apiClient.js'
import { formatFileSize } from '../../utils/format.js'

import styles from './billingsPage.module.css'

const INTERVAL_OPTIONS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual', hint: 'Save 20%' },
]

const SUBSCRIPTION_BADGES = {
  active: { tone: 'active', label: 'Active' },
  non_renewing: { tone: 'atRisk', label: 'Non-renewing' },
  past_due: { tone: 'atRisk', label: 'Attention' },
  canceled: { tone: 'inactive', label: 'Cancelled' },
  expired: { tone: 'inactive', label: 'Expired' },
}

const PAYMENT_BADGES = {
  paid: { tone: 'active', label: 'Paid' },
  processing: { tone: 'lead', label: 'Processing' },
  pending: { tone: 'inactive', label: 'Pending' },
  failed: { tone: 'atRisk', label: 'Failed' },
  abandoned: { tone: 'atRisk', label: 'Abandoned' },
  reversed: { tone: 'atRisk', label: 'Reversed' },
}

const PLAN_NAME_BY_ID = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  premium: 'Premium',
}

const KEEP_ALIVE_STATUSES = ['active', 'non_renewing', 'past_due']

function formatDate(isoDate) {
  if (!isoDate) return ''

  return new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatMoney(amount, currency = 'USD') {
  const rounded = Math.round(Number(amount) * 100) / 100
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2)

  return currency === 'USD' ? `$${text}` : `${text} ${currency}`
}

function pricePresentation(plan, interval) {
  if (!plan || plan.isFree) {
    return null
  }

  if (interval === 'annual') {
    return {
      mode: 'annual',
      effectiveMonthly: plan.annualEffectiveMonthlyPrice,
      monthlyEquivalent: plan.monthlyPrice,
      total: plan.annualPrice,
      savingsPercent: plan.savingsPercent,
      currency: plan.currency,
    }
  }

  return {
    mode: 'monthly',
    price: plan.monthlyPrice,
    currency: plan.currency,
  }
}

export default function BillingSettingsPage() {
  const [billing, setBilling] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [billingInterval, setBillingInterval] = useState('monthly')
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [verifyingReference, setVerifyingReference] = useState('')
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [toast, setToast] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()

  const loadBilling = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const response = await api.get('/billing')

      setBilling(response?.data ?? null)
    } catch (requestError) {
      setLoadError(
        requestError.message ||
          'Unable to load your billing information right now.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBilling()
  }, [loadBilling])

  useEffect(() => {
    const reference = searchParams.get('reference')

    if (!reference || verifyingReference) {
      return
    }

    let cancelled = false

    setVerifyingReference(reference)

    const verifyReturnedPayment = async () => {
      let receivedBilling = false

      try {
        const response = await api.post('/billing/verify', { reference })

        if (cancelled) return

        if (response?.data?.billing) {
          setBilling(response.data.billing)
          receivedBilling = true
        }

        setToast(verificationToastMessage(response?.data))
      } catch (requestError) {
        if (!cancelled) {
          setToast(
            requestError.message ||
              'We could not confirm this payment right now.',
          )
        }
      } finally {
        if (!cancelled) {
          setVerifyingReference('')
          setSearchParams({}, { replace: true })

          if (!receivedBilling) {
            loadBilling()
          }
        }
      }
    }

    verifyReturnedPayment()

    return () => {
      cancelled = true
    }
  }, [searchParams, verifyingReference, setSearchParams, loadBilling])

  const plans = billing?.plans ?? []
  const subscription = billing?.subscription ?? null
  const currentPlanId = subscription?.plan ?? 'starter'
  const currentPlanData =
    plans.find((plan) => plan.id === currentPlanId) ?? null

  const hasPaidSubscription =
    Boolean(subscription) &&
    currentPlanId !== 'starter' &&
    KEEP_ALIVE_STATUSES.includes(subscription.status)

  const isNonRenewing =
    subscription?.status === 'non_renewing' ||
    Boolean(subscription?.cancelAtPeriodEnd)

  const selectedPlan = selectedPlanId
    ? plans.find((plan) => plan.id === selectedPlanId) ?? null
    : null

  const selectedPresentation = selectedPlan
    ? pricePresentation(selectedPlan, billingInterval)
    : null

  const isRenewalPurchase =
    Boolean(selectedPlan) &&
    selectedPlan.id === currentPlanId &&
    subscription?.billingInterval === billingInterval &&
    hasPaidSubscription

  const openPlanModal = (plan) => {
    if (!billing || isLoading) return

    setSelectedPlanId(plan.id)
  }

  const closePlanModal = () => {
    setSelectedPlanId(null)
    setCheckoutLoading(false)
  }

  const startCheckout = async () => {
    if (!selectedPlan) return

    setCheckoutLoading(true)

    try {
      const response = await api.post('/billing/initialize', {
        plan: selectedPlan.id,
        billingInterval,
      })

      const authorizationUrl = response?.data?.authorizationUrl

      if (!authorizationUrl) {
        throw new Error(
          'Checkout could not be started. Please try again in a moment.',
        )
      }

      window.location.assign(authorizationUrl)
    } catch (requestError) {
      setToast(
        requestError.message ||
          'Checkout could not be started. Please try again in a moment.',
      )
      setCheckoutLoading(false)
    }
  }

  const openCancelModal = () => setIsCancelModalOpen(true)

  const closeCancelModal = () => {
    setIsCancelModalOpen(false)
    setCancelLoading(false)
  }

  const confirmCancelSubscription = async () => {
    setCancelLoading(true)

    try {
      await api.post('/billing/cancel')

      closeCancelModal()

      setToast(
        `Your subscription will stay active until ${
          formatDate(subscription?.currentPeriodEnd) || 'the end of the period'
        }.`,
      )

      await loadBilling()
    } catch (requestError) {
      closeCancelModal()
      setToast(
        requestError.message ||
          'Cancellation failed. Please try again shortly.',
      )
    }
  }

  const subscriptionBadge = SUBSCRIPTION_BADGES[subscription?.status] ?? {
    tone: 'inactive',
    label: 'Inactive',
  }

  const storageUsedLabel = formatFileSize(billing?.storage?.usedBytes ?? 0)
  const storageLimitLabel = formatFileSize(billing?.storage?.limitBytes ?? 0)

  const storagePercent =
    billing?.storage?.limitBytes > 0
      ? Math.min(
          100,
          Math.round(
            ((billing.storage.usedBytes ?? 0) /
              billing.storage.limitBytes) *
              100,
          ),
        )
      : 0

  return (
    <PageLayout
      title="Billing & Subscription"
      subtitle="Manage your plan"
      actions={
        <Link
          to="/settings"
          className="ghost-btn"
        >
          <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          Back to settings
        </Link>
      }
    >
      <PageSection>
        <div className={styles.page}>
          {loadError && (
            <div
              className={styles.errorBanner}
              role="alert"
            >
              <span>{loadError}</span>

              <button
                type="button"
                onClick={loadBilling}
              >
                Retry
              </button>
            </div>
          )}

          {verifyingReference && (
            <div className={styles.verifyBanner}>
              Confirming your payment…
            </div>
          )}

          {isLoading && !billing ? (
            <>
              <div
                className={`${styles.skeletonHero} ${styles.skeleton}`}
                aria-hidden="true"
              />

              <div className={styles.planGrid}>
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`${styles.planCard} ${styles.skeletonCard}`}
                    aria-hidden="true"
                  >
                    <span className={`${styles.skeleton} ${styles.skeletonLine}`} />

                    <span
                      className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`}
                    />

                    <span
                      className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMedium}`}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <section className={styles.currentPlan}>
                <div className={styles.planCopy}>
                  <span className={styles.eyebrow}>
                    Current plan
                  </span>

                  <div className={styles.planTitle}>
                    <h2>
                      {currentPlanData?.name ??
                        PLAN_NAME_BY_ID[currentPlanId] ??
                        'Starter'}
                    </h2>

                    <Badge tone={subscriptionBadge.tone}>
                      {subscriptionBadge.label}
                    </Badge>
                  </div>

                  {isNonRenewing && subscription?.currentPeriodEnd && (
                    <p>
                      Your subscription remains active until{' '}
                      <strong>
                        {formatDate(subscription.currentPeriodEnd)}
                      </strong>
                      .
                    </p>
                  )}

                  {!isNonRenewing && (
                    <p>{currentPlanData?.description}</p>
                  )}
                </div>

                <div className={styles.planPrice}>
                  {currentPlanId === 'starter' || !hasPaidSubscription ? (
                    <>
                      <strong>Free</strong>
                      <span>forever</span>
                    </>
                  ) : subscription.billingInterval === 'annual' ? (
                    <>
                      <strong>
                        {formatMoney(
                          currentPlanData?.annualEffectiveMonthlyPrice ?? 0,
                          currentPlanData?.currency,
                        )}
                        /mo
                      </strong>

                      <span>
                        Billed{' '}
                        {formatMoney(
                          currentPlanData?.annualPrice ?? 0,
                          currentPlanData?.currency,
                        )}{' '}
                        annually
                      </span>
                    </>
                  ) : (
                    <>
                      <strong>
                        {formatMoney(
                          currentPlanData?.monthlyPrice ?? 0,
                          currentPlanData?.currency,
                        )}
                      </strong>

                      <span>per month</span>
                    </>
                  )}

                  {hasPaidSubscription && subscription?.currentPeriodEnd && (
                    <span className={styles.periodNote}>
                      Period ends {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  )}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.eyebrow}>
                      Plans
                    </span>

                    <h2>
                      Choose the right plan
                    </h2>

                    <p>
                      Upgrade or change your subscription
                      as your business grows.
                    </p>
                  </div>

                  <div
                    className={styles.intervalToggle}
                    role="group"
                    aria-label="Billing interval"
                  >
                    {INTERVAL_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`${
                          billingInterval === option.id
                            ? styles.intervalOptionActive
                            : styles.intervalOption
                        }`}
                        aria-pressed={
                          billingInterval === option.id
                        }
                        onClick={() =>
                          setBillingInterval(option.id)
                        }
                      >
                        {option.label}

                        {option.hint && (
                          <span>{option.hint}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.planGrid}>
                  {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId

                    const presentation = pricePresentation(
                      plan,
                      billingInterval,
                    )

                    const isCurrentActionable =
                      isCurrent && hasPaidSubscription

                    return (
                      <article
                        className={`${styles.planCard} ${
                          isCurrent ? styles.planCardActive : ''
                        }`}
                        key={plan.id}
                      >
                        <div className={styles.planCardHeader}>
                          <div>
                            <h3>{plan.name}</h3>

                            <p>
                              {plan.description}
                            </p>
                          </div>

                          {isCurrent && (
                            <Badge tone="active">
                              Current
                            </Badge>
                          )}
                        </div>

                        <div className={styles.cardPrice}>
                          {presentation === null ? (
                            <>
                              <strong>Free</strong>
                              <span>forever</span>
                            </>
                          ) : presentation.mode === 'monthly' ? (
                            <>
                              <strong>
                                {formatMoney(
                                  presentation.price,
                                  presentation.currency,
                                )}
                              </strong>

                              <span>/ month</span>
                            </>
                          ) : (
                            <div className={styles.priceStack}>
                              <div className={styles.priceRow}>
                                <strong>
                                  {formatMoney(
                                    presentation.effectiveMonthly,
                                    presentation.currency,
                                  )}
                                </strong>

                                <span>/ month</span>
                              </div>

                              <span className={styles.originalPrice}>
                                {formatMoney(
                                  presentation.monthlyEquivalent,
                                  presentation.currency,
                                )}{' '}
                                / month
                              </span>

                              <span className={styles.billedNote}>
                                Billed{' '}
                                {formatMoney(
                                  presentation.total,
                                  presentation.currency,
                                )}{' '}
                                annually
                              </span>

                              <span className={styles.saveBadge}>
                                Save {presentation.savingsPercent}%
                              </span>
                            </div>
                          )}
                        </div>

                        <ul className={styles.features}>
                          {plan.features.map((feature) => (
                            <li key={feature}>
                              <Check
                                size={13}
                                weight="bold"
                                aria-hidden="true"
                              />

                              {feature}
                            </li>
                          ))}
                        </ul>

                        <button
                          className={
                            isCurrent && !isCurrentActionable
                              ? 'ghost-btn'
                              : 'primary-btn'
                          }
                          type="button"
                          disabled={isCurrent && !isCurrentActionable}
                          onClick={() => openPlanModal(plan)}
                        >
                          {isCurrent && !isCurrentActionable
                            ? 'Current plan'
                            : isCurrentActionable
                              ? 'Renew / extend'
                              : `Choose ${plan.name}`}
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.eyebrow}>
                      Payment
                    </span>

                    <h2>
                      Payment method
                    </h2>

                    <p>
                      Payments are processed securely by
                      Paystack. Rayern never sees or stores
                      your card details.
                    </p>
                  </div>
                </div>

                <div className={styles.paymentCard}>
                  <div className={styles.paymentIcon}>
                    $
                  </div>

                  <div className={styles.paymentInfo}>
                    <strong>
                      Secure checkout via Paystack
                    </strong>

                    <span>
                      Card payments are handled entirely on
                      Paystack's secure platform.
                    </span>
                  </div>
                </div>

                {billing?.storage && (
                  <div className={styles.storageCard}>
                    <div className={styles.paymentInfo}>
                      <strong>
                        File storage
                      </strong>

                      <span>
                        {storageLimitLabel
                          ? `${storageUsedLabel || '0 KB'} of ${storageLimitLabel} used`
                          : 'Storage usage is unavailable.'}
                      </span>

                      <div
                        className={styles.storageBar}
                        role="presentation"
                      >
                        <div
                          className={styles.storageBarFill}
                          style={{ width: `${storagePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div>
                    <span className={styles.eyebrow}>
                      Billing history
                    </span>

                    <h2>
                      Invoices
                    </h2>

                    <p>
                      View your previous Rayern
                      payments.
                    </p>
                  </div>
                </div>

                <div className={styles.invoiceCard}>
                  {(billing?.payments ?? []).length === 0 ? (
                    <div className={styles.emptyState}>
                      <strong>
                        No invoices yet
                      </strong>

                      <p>
                        Your invoices will appear here
                        after your first payment.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.invoiceHeader}>
                        <span>Invoice</span>
                        <span>Date</span>
                        <span>Description</span>
                        <span>Amount</span>
                        <span>Status</span>
                      </div>

                      {(billing?.payments ?? []).map((payment) => {
                        const badge = PAYMENT_BADGES[payment.status] ?? {
                          tone: 'inactive',
                          label: payment.status,
                        }

                        return (
                          <div
                            className={styles.invoiceRow}
                            key={payment.id}
                          >
                            <strong>
                              {payment.reference}
                            </strong>

                            <span>
                              {formatDate(payment.date)}
                            </span>

                            <span>
                              {payment.description}
                              {payment.billingInterval ===
                              'annual'
                                ? ' · annual'
                                : ''}
                            </span>

                            <span>
                              {formatMoney(
                                payment.amount,
                                payment.currency,
                              )}
                            </span>

                            <Badge tone={badge.tone}>
                              {badge.label}
                            </Badge>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              </section>

              {hasPaidSubscription && (
                <section className={styles.dangerZone}>
                  <div>
                    <span className={styles.eyebrow}>
                      Subscription
                    </span>

                    <h2>
                      Cancel subscription
                    </h2>

                    {isNonRenewing ? (
                      <p>
                        Your subscription will not renew.
                        Access continues until{' '}
                        {formatDate(
                          subscription.currentPeriodEnd,
                        )}
                        .
                      </p>
                    ) : (
                      <p>
                        Cancellation stops future billing
                        while keeping your workspace
                        available until the end of the
                        current period.
                      </p>
                    )}
                  </div>

                  {!isNonRenewing && (
                    <button
                      className={styles.dangerButton}
                      type="button"
                      onClick={openCancelModal}
                    >
                      Cancel subscription
                    </button>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </PageSection>

      <Modal
        open={Boolean(selectedPlan)}
        onClose={closePlanModal}
        title={`Switch to ${
          selectedPlan?.name ?? 'plan'
        }`}
        subtitle="Confirm plan change"
        footer={
          selectedPlan?.id === 'starter' ? (
            <button
              className="ghost-btn"
              type="button"
              onClick={closePlanModal}
            >
              Close
            </button>
          ) : (
            <>
              <button
                className="ghost-btn"
                type="button"
                onClick={closePlanModal}
                disabled={checkoutLoading}
              >
                Back
              </button>

              <button
                className="primary-btn"
                type="button"
                disabled={checkoutLoading}
                onClick={startCheckout}
              >
                {checkoutLoading
                  ? 'Redirecting…'
                  : 'Continue to payment'}
              </button>
            </>
          )
        }
      >
        <div className={styles.confirmContent}>
          {selectedPlan?.id === 'starter' ? (
            <>
              <p>
                Starter is Rayern's free plan. To move
                down from{' '}
                <strong>
                  {currentPlanData?.name ?? currentPlanId}
                </strong>
                , cancel your subscription below — your
                paid access continues until the end of the
                current period.
              </p>
            </>
          ) : (
            <>
              <p>
                You're about to switch from{' '}
                <strong>
                  {currentPlanData?.name ?? 'Starter'}
                </strong>{' '}
                to{' '}
                <strong>
                  {selectedPlan?.name}
                </strong>
                .
              </p>

              <div className={styles.confirmPlan}>
                <div>
                  <span>
                    New plan
                  </span>

                  <strong>
                    {selectedPlan?.name}
                  </strong>
                </div>

                <div>
                  <span>
                    Billing
                  </span>

                  <strong>
                    {billingInterval === 'annual'
                      ? 'Annual'
                      : 'Monthly'}
                  </strong>
                </div>

                <div>
                  <span>
                    Total today
                  </span>

                  <strong>
                    {selectedPresentation === null
                      ? 'Free'
                      : selectedPresentation.mode === 'monthly'
                        ? `${formatMoney(
                            selectedPresentation.price,
                            selectedPresentation.currency,
                          )}/mo`
                        : `${formatMoney(
                            selectedPresentation.total,
                            selectedPresentation.currency,
                          )}/yr`}
                  </strong>
                </div>
              </div>

              {selectedPresentation?.mode === 'annual' && (
                <p>
                  That works out to{' '}
                  <strong>
                    {formatMoney(
                      selectedPresentation.effectiveMonthly,
                      selectedPresentation.currency,
                    )}
                    /month
                  </strong>{' '}
                  — you save{' '}
                  {selectedPresentation.savingsPercent}% with
                  annual billing.
                </p>
              )}

              {isRenewalPurchase && (
                <p>
                  This payment extends your current
                  subscription period — no plan change is
                  needed.
                </p>
              )}

              <p>
                You'll be redirected to Paystack to pay
                securely. Your plan updates automatically
                once your payment is verified.
              </p>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={isCancelModalOpen}
        onClose={closeCancelModal}
        title="Cancel subscription?"
        subtitle="Confirm cancellation"
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={closeCancelModal}
              disabled={cancelLoading}
            >
              Keep subscription
            </button>

            <button
              className={styles.dangerButton}
              type="button"
              disabled={cancelLoading}
              onClick={confirmCancelSubscription}
            >
              {cancelLoading
                ? 'Cancelling…'
                : 'Cancel subscription'}
            </button>
          </>
        }
      >
        <div className={styles.confirmContent}>
          <p>
            Your{' '}
            <strong>
              {currentPlanData?.name ?? currentPlanId}
            </strong>{' '}
            plan stays fully active until{' '}
            <strong>
              {formatDate(subscription?.currentPeriodEnd)}
            </strong>
            . After that your workspace moves to the free
            Starter plan and you won't be charged again.
          </p>
        </div>
      </Modal>

      <Toast
        title="Billing"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </PageLayout>
  )
}

function verificationToastMessage(data) {
  const status = data?.payment?.status

  switch (status) {
    case 'paid':
      return `Payment confirmed — ${
        PLAN_NAME_BY_ID[data?.payment?.plan] ?? 'your plan'
      } is now active.`
    case 'processing':
      return 'Payment received. Activation is finishing — refresh in a moment.'
    case 'pending':
      return 'Payment is still being confirmed. This page will update once it completes.'
    case 'failed':
      return 'The payment could not be completed. You have not been charged.'
    case 'abandoned':
      return 'Checkout closed before payment was completed. You can try again anytime.'
    default:
      if (typeof status === 'string' && status.startsWith('flagged')) {
        return 'This payment needs manual review. Please contact support if you were charged.'
      }
      return 'We could not confirm this payment yet. Please check back shortly.'
  }
}
