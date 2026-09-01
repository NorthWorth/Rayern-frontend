import styles from './avatar.module.css'

export default function Avatar({ name, size = 'md', color = 'indigo' }) {
  const initials = (name || 'Client')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`${styles.avatar} ${styles[size]} ${styles[color]}`.trim()} aria-hidden="true">
      {initials}
    </div>
  )
}
