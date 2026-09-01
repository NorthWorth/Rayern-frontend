import { Link } from 'react-router-dom'

import dashboardScreenshot from '../../../../assets/rayern-screenshot.png'

import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section
      className={styles.hero}
      id="top"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            Client management workspace
          </span>

          <h1 className={styles.title}>
            Your client business,
            <span className={styles.titleAccent}>
              finally in one place.
            </span>
          </h1>

          <p className={styles.subtitle}>
            Rayern keeps clients, projects, tasks,
            deliverables, meetings, and documents in a
            single organized workspace — so freelancers,
            agencies, and consultants can run the whole
            client journey without the scatter.
          </p>

          <div className={styles.ctaRow}>
            <Link
              to="/signup"
              className={styles.primaryCta}
            >
              Get Started
            </Link>

            <a
              href="#how-it-works"
              className={styles.secondaryCta}
            >
              See How It Works
            </a>
          </div>

          <p className={styles.note}>
            Free to try. Set up your workspace in
            minutes.
          </p>
        </div>

        <div className={styles.preview}>
          <div className={styles.frame}>
            <div className={styles.frameBar}>
              <span className={styles.frameDot} />
              <span className={styles.frameDot} />
              <span className={styles.frameDot} />

              <span className={styles.frameTitle}>
                app.rayern.com/dashboard
              </span>
            </div>

            <img
              src={dashboardScreenshot}
              alt="The Rayern dashboard showing clients, projects, tasks, and deliverables at a glance"
              className={styles.screenshot}
              width="1348"
              height="676"
              loading="eager"
            />
          </div>

          <div
            className={styles.previewGlow}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
