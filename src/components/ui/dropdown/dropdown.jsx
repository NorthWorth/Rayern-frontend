import { useEffect, useRef } from 'react'
import styles from './dropdown.module.css'

export default function Dropdown({ open, onClose, anchorLabel, items, align = 'right' }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', onPointerDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div ref={menuRef} className={`${styles.menu} ${align === 'left' ? styles.left : styles.right}`.trim()} role="menu" aria-label={anchorLabel}>
      {items.map((item) => (
        <button key={item.label} type="button" className={styles.item} role="menuitem" onClick={() => item.onSelect()}>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
