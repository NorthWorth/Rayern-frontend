import Navbar from './components/Navbar/Navbar.jsx'
import Hero from './components/Hero/Hero.jsx'
import Problem from './components/Problem/Problem.jsx'
import Features from './components/Features/Features.jsx'
import HowItWorks from './components/HowItWorks/HowItWorks.jsx'
import Benefits from './components/Benefits/Benefits.jsx'
import ProductPreview from './components/ProductPreview/ProductPreview.jsx'
import CTA from './components/CTA/CTA.jsx'
import Footer from './components/Footer/Footer.jsx'

import styles from './LandingPage.module.css'

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <Navbar />

      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <Benefits />
        <ProductPreview />
        <CTA />
      </main>

      <Footer />
    </div>
  )
}
