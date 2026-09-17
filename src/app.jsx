import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import './app.css'

import ProtectedRoute from './components/routing/protectedRoute/protectedRoute.jsx'
import PublicRoute from './components/routing/publicRoute/publicRoute.jsx'
import RouteDataProviders from './components/routing/routeDataProviders/routeDataProviders.jsx'
import { DeliverableProvider } from './context/deliverableContext.jsx'

const DashboardPage = lazy(() => import('./pages/dashboardPage/dashboardPage.jsx'))
const ClientsPage = lazy(() => import('./pages/clientsPage/clientsPage.jsx'))
const ClientProfilePage = lazy(() => import('./pages/clientProfilePage/clientProfilePage.jsx'))
const LeadsPage = lazy(() => import('./pages/leadsPage/leadsPage.jsx'))
const LeadsProfilePage = lazy(() => import('./pages/leadsProfilePage/leadsProfilePage.jsx'))
const ProjectsPage = lazy(() => import('./pages/projectsPage/projectsPage.jsx'))
const TasksPage = lazy(() => import('./pages/tasksPage/tasksPage.jsx'))
const ComingSoonPage = lazy(() => import('./pages/comingSoonPage/comingSoonPage.jsx'))
const DocumentsPage = lazy(() => import('./pages/documentsPage/documentsPage.jsx'))
const SettingsPage = lazy(() => import('./pages/settingsPage/settingsPage.jsx'))
const DeliverablesPage = lazy(() => import('./pages/deliverablesPage/deliverablesPage.jsx'))
const ReviewPage = lazy(() => import('./pages/reviewPage/reviewPage.jsx'))
const PublicReviewPage = lazy(() => import('./pages/reviewPage/publicReviewPage.jsx'))
const BillingPage = lazy(() => import('./pages/billingsPage/billingsPage.jsx'))
const NotificationsPage = lazy(() => import('./pages/notificationsPage/notificationsPage.jsx'))
const ProfileSettingsPage = lazy(() => import('./pages/profileSettingsPage/profileSettingsPage.jsx'))
const WorkspaceSettingsPage = lazy(() => import('./pages/workspaceSettingsPage/workspaceSettingsPage.jsx'))
const ProjectProfilePage = lazy(() => import('./pages/projectProfilePage/projectProfilePage.jsx'))
const TaskProfilePage = lazy(() => import('./pages/taskProfilePage/taskProfilePage.jsx'))
const LoginPage = lazy(() => import('./pages/loginPage/loginPage.jsx'))
const SignupPage = lazy(() => import('./pages/signupPage/signupPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/forgotPasswordPage/forgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/resetPasswordPage/resetPasswordPage.jsx'))
const NotificationSettingsPage = lazy(() => import('./pages/notificationSettingsPage/notificationSettingsPage.jsx'))
const AdminWaitlistPage = lazy(() => import('./pages/adminWaitlistPage/adminWaitlistPage.jsx'))

import HomeRoute from './components/routing/homeRoute/homeRoute.jsx'

function App() {
  return (
    <Suspense fallback={<div className="route-loading">Loading Rayern...</div>}>
      <Routes>
      {/* Root entry */}
      <Route
        path="/"
        element={<HomeRoute />}
      />

      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
      </Route>

      {/* Public client review */}
      <Route
        path="/public-review/:token"
        element={
          <DeliverableProvider loadOnMount={false}>
            <PublicReviewPage />
          </DeliverableProvider>
        }
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RouteDataProviders />}>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/clients/:id"
          element={<ClientProfilePage />}
        />

        <Route
          path="/clients"
          element={<ClientsPage />}
        />

        <Route
          path="/leads"
          element={<LeadsPage />}
        />

        <Route
          path="/leads/:id"
          element={<LeadsProfilePage />}
        />

        <Route
          path="/projects"
          element={<ProjectsPage />}
        />

        <Route
          path="/projects/:id"
          element={<ProjectProfilePage />}
        />

        <Route
          path="/tasks"
          element={<TasksPage />}
        />

        <Route
          path="/tasks/:id"
          element={<TaskProfilePage />}
        />

        <Route
          path="/meetings"
          element={<ComingSoonPage />}
        />

        <Route
          path="/documents"
          element={<DocumentsPage />}
        />

        <Route
          path="/deliverables"
          element={<DeliverablesPage />}
        />

        <Route
          path="/review/:id"
          element={<ReviewPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        <Route
          path="/settings/billing"
          element={<BillingPage />}
        />

        <Route
          path="/notifications"
          element={<NotificationsPage />}
        />

        <Route
          path="/settings/profile"
          element={<ProfileSettingsPage />}
        />

        <Route
          path="/settings/workspace"
          element={<WorkspaceSettingsPage />}
        />

        <Route
          path="/settings/notifications"
          element={<NotificationSettingsPage />}
        />

        <Route
          path="/admin/waitlist"
          element={<AdminWaitlistPage />}
        />

        <Route
          path="*"
          element={<DashboardPage />}
        />
        </Route>
      </Route>
      </Routes>
    </Suspense>
  )
}

export default App