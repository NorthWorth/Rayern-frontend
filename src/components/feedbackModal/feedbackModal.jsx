import { useState, useCallback, useEffect, useRef } from 'react'

import Modal from '../ui/modal/modal.jsx'
import Toast from '../ui/toast/toast.jsx'
import Select from '../forms/select.jsx'
import Textarea from '../forms/textarea.jsx'

import { useAuth } from '../../context/authContext.jsx'
import api from '../../api/apiClient.js'

import styles from './feedbackModal.module.css'

const FEEDBACK_OPTIONS = [
  { value: 'General feedback', label: 'General feedback' },
  { value: 'Feature request', label: 'Feature request' },
  { value: 'Bug report', label: 'Bug report' },
  { value: 'Something is confusing', label: 'Something is confusing' },
]

const MAX_MESSAGE_LENGTH = 5000

export default function FeedbackModal({ open, onClose }) {
  const { user, workspace } = useAuth()

  const [feedbackType, setFeedbackType] = useState('Feature request')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  const userEmail = user?.email || 'unknown@rayern.com'
  const workspaceName = workspace?.name || ''

  const prevOpenRef = useRef(open)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setFeedbackType('Feature request')
      setMessage('')
      setErrors({})
      setIsSubmitting(false)
    }

    prevOpenRef.current = open
  }, [open])

  const validate = useCallback(() => {
    const nextErrors = {}

    if (!feedbackType) {
      nextErrors.feedbackType = 'Please select a feedback type.'
    }

    const trimmed = message.trim()

    if (!trimmed) {
      nextErrors.message = 'Please enter your feedback.'
    } else if (trimmed.length > MAX_MESSAGE_LENGTH) {
      nextErrors.message =
        'Feedback must be ' + MAX_MESSAGE_LENGTH + ' characters or fewer.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }, [feedbackType, message])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      if (!validate()) {
        return
      }

      if (isSubmitting) {
        return
      }

      setIsSubmitting(true)

      try {
        await api.post('/feedback', {
          feedbackType,
          message: message.trim(),
          workspaceName,
        })

        onClose()
      } catch (requestError) {
        setToast(
          requestError.message ||
            "We couldn't send your feedback right now. Please try again.",
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [feedbackType, message, workspaceName, validate, isSubmitting, onClose],
  )

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Send feedback"
        subtitle="Help make Rayern better"
        footer={
          <>
            <button
              className="ghost-btn"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              className="primary-btn"
              type="submit"
              form="feedback-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Send feedback'}
            </button>
          </>
        }
      >
        <div className={styles.emailRow}>
          <span className={styles.emailLabel}>Email</span>
          <span className={styles.emailValue}>{userEmail}</span>
        </div>

        <form id="feedback-form" onSubmit={handleSubmit}>
          <Select
            label="Feedback type"
            name="feedbackType"
            value={feedbackType}
            onChange={(event) => {
              setFeedbackType(event.target.value)
              if (errors.feedbackType) {
                setErrors((current) => {
                  const next = { ...current }
                  delete next.feedbackType
                  return next
                })
              }
            }}
            options={FEEDBACK_OPTIONS}
            error={errors.feedbackType}
            required
          />

          <Textarea
            label="Your feedback"
            name="message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              if (errors.message) {
                setErrors((current) => {
                  const next = { ...current }
                  delete next.message
                  return next
                })
              }
            }}
            placeholder="Tell us what you think..."
            error={errors.message}
            required
            rows={5}
          />
        </form>
      </Modal>

      <Toast
        title="Feedback"
        message={toast}
        visible={Boolean(toast)}
        onClose={() => setToast('')}
      />
    </>
  )
}
