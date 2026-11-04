import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './app.jsx'

import { AuthProvider } from './context/authContext.jsx'
import { captureAttribution } from './utils/attribution.js'

import './index.css'

// First-touch acquisition capture (UTM + referrer host + landing
// path, stored locally, submitted with registration). Must run before
// the auth flow so the first navigation is the recorded touch.
captureAttribution()

// Register the PWA service worker in production builds only, after
// the app has rendered, so it can never delay or break first load.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration must never affect the app itself.
    })
  })
}

ReactDOM.createRoot(
  document.getElementById('root'),
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)