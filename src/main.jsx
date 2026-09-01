import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './app.jsx'

import { AuthProvider } from './context/authContext.jsx'
import { ClientProvider } from './context/clientContext.jsx'
import { DeliverableProvider } from './context/deliverableContext.jsx'
import { NotificationProvider } from './context/notificationContext.jsx'
import { ProjectProvider } from './context/projectContext.jsx'
import { LeadProvider } from './context/leadContext.jsx'
import { TaskProvider } from './context/taskContext.jsx'
import { DocumentProvider } from './context/documentContext.jsx'

import './index.css'

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
        <ProjectProvider>
          <ClientProvider>
            <DeliverableProvider>
              <NotificationProvider>
                <LeadProvider>
                  <TaskProvider>
                    <DocumentProvider>
                      <App />
                    </DocumentProvider>
                  </TaskProvider>
                </LeadProvider>
              </NotificationProvider>
            </DeliverableProvider>
          </ClientProvider>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)