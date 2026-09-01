import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'

import styles from './Navbar.module.css'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#benefits', label: 'Why Rayern' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleClose = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleClose)

    return () => {
      window.removeEventListener('keydown', handleClose)
    }
  }, [isOpen])

  return (
    <header className={styles.header}>
      <nav
        className={styles.nav}
        aria-label="Landing page navigation"
      >
        <Link
          to="/"
          className={styles.brand}
          onClick={() => setIsOpen(false)}
        >
          <img
            src="/rayern-favicons.webp"
            alt="Rayern logo"
            className={styles.brandMark}
          />

          <span className={styles.brandName}>
            Rayern
          </span>
        </Link>

        <div className={styles.links}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.link}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className={styles.actions}>
          <Link
            to="/login"
            className={styles.login}
          >
            Log in
          </Link>

          <Link
            to="/signup"
            className={styles.cta}
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isOpen}
          aria-controls="landing-mobile-menu"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? (
            <X
              size={20}
              weight="bold"
              aria-hidden="true"
            />
          ) : (
            <List
              size={20}
              weight="bold"
              aria-hidden="true"
            />
          )}
        </button>
      </nav>

      <div
        id="landing-mobile-menu"
        className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`}
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={styles.mobileLink}
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </a>
        ))}

        <div className={styles.mobileActions}>
          <Link
            to="/login"
            className={styles.mobileLogin}
            onClick={() => setIsOpen(false)}
          >
            Log in
          </Link>

          <Link
            to="/signup"
            className={styles.cta}
            onClick={() => setIsOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
