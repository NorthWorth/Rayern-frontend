import { Link } from 'react-router-dom'

import styles from './Footer.module.css'

const productLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#benefits', label: 'Why Rayern' },
]

const accountLinks = [
  { to: '/login', label: 'Log in' },
  { to: '/signup', label: 'Create account' },
  { to: '/dashboard', label: 'Open workspace' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link
              to="/"
              className={styles.brand}
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

            <p className={styles.tagline}>
              The client-management workspace for
              freelancers, agencies, and consultants.
            </p>
          </div>

          <nav
            className={styles.linkCols}
            aria-label="Footer navigation"
          >
            <div className={styles.linkCol}>
              <h3 className={styles.colTitle}>
                Product
              </h3>

              {productLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={styles.link}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className={styles.linkCol}>
              <h3 className={styles.colTitle}>
                Get started
              </h3>

              {accountLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={styles.link}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <span>
            © {new Date().getFullYear()} Rayern. All
            rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
