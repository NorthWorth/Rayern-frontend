import { useEffect, useRef, useCallback } from 'react'
import styles from './dropdown.module.css'
import { X } from '@phosphor-icons/react'

export default function Dropdown({
  open,
  onClose,
  anchorLabel,
  items,
  align = 'right',
}) {
  const menuRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const listRef = useRef(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const close = useCallback(() => {
    onCloseRef.current()
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        close()
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close()
        return
      }

      if (event.key === 'Tab') {
        const items = listRef.current?.querySelectorAll('button:not([disabled])')
        if (!items || items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  if (!open) return null

  const resolvedItems = typeof items === 'function' ? items() : items

  return (
    <div
      ref={menuRef}
      className={`${styles.menu} ${align === 'left' ? styles.left : styles.right}`.trim()}
      role="menu"
      aria-label={anchorLabel}
    >
      <button
        type="button"
        className={styles.closeButton}
        onClick={close}
        aria-label="Close menu"
      >
        <X size={14} weight="bold" aria-hidden="true" />
      </button>
      <ul ref={listRef} style={{ listStyle: 'none', padding: '4px', margin: 0, display: 'grid', gap: '4px' }}>
        {resolvedItems.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={styles.item}
              role="menuitem"
              onClick={() => {
                item.onSelect?.()
                close()
              }}
            >
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
