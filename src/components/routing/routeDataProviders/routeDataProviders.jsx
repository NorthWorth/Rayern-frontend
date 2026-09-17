import { Outlet, useLocation } from 'react-router-dom'

import { ClientProvider } from '../../../context/clientContext.jsx'
import { DeliverableProvider } from '../../../context/deliverableContext.jsx'
import { DocumentProvider } from '../../../context/documentContext.jsx'
import { LeadProvider } from '../../../context/leadContext.jsx'
import { NotificationProvider } from '../../../context/notificationContext.jsx'
import { ProjectProvider } from '../../../context/projectContext.jsx'
import { TaskProvider } from '../../../context/taskContext.jsx'

function withProvider(content, Provider) {
  return <Provider>{content}</Provider>
}

export default function RouteDataProviders() {
  const { pathname } = useLocation()
  let content = <Outlet />

  const isDashboard = pathname === '/dashboard'
  const isClients = pathname === '/clients'
  const isClientProfile = pathname.startsWith('/clients/')
  const isLeads = pathname === '/leads' || pathname.startsWith('/leads/')
  const isProjects = pathname === '/projects'
  const isProjectProfile = pathname.startsWith('/projects/')
  const isTasks = pathname === '/tasks'
  const isTaskProfile = pathname.startsWith('/tasks/')
  const isDocuments = pathname === '/documents'
  const isDeliverables = pathname === '/deliverables'
  const isReview = pathname.startsWith('/review/')

  if (isDashboard || isClients || isClientProfile || isProjects || isProjectProfile) {
    content = withProvider(content, ClientProvider)
  }

  if (isDashboard || isClientProfile || isProjectProfile || isDeliverables || isReview) {
    content = withProvider(content, DeliverableProvider)
  }

  if (isDashboard || isProjectProfile || isTasks || isTaskProfile) {
    content = withProvider(content, TaskProvider)
  }

  if (isDashboard || isProjects || isProjectProfile || isTasks || isTaskProfile || isDeliverables) {
    content = withProvider(content, ProjectProvider)
  }

  if (isLeads) {
    content = withProvider(content, LeadProvider)
  }

  if (isDocuments) {
    content = withProvider(content, DocumentProvider)
  }

  return withProvider(content, NotificationProvider)
}
