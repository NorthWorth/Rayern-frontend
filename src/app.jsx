import { Route, Routes } from 'react-router-dom'
import './app.css'

import ProtectedRoute from './components/routing/protectedRoute/protectedRoute.jsx'
import PublicRoute from './components/routing/publicRoute/publicRoute.jsx'

import DashboardPage from './pages/dashboardPage/dashboardPage.jsx'
import ClientsPage from './pages/clientsPage/clientsPage.jsx'
import ClientProfilePage from './pages/clientProfilePage/clientProfilePage.jsx'
import LeadsPage from './pages/leadsPage/leadsPage.jsx'
import LeadsProfilePage from './pages/leadsProfilePage/leadsProfilePage.jsx'
import ProjectsPage from './pages/projectsPage/projectsPage.jsx'
import TasksPage from './pages/tasksPage/tasksPage.jsx'
import ComingSoonPage from './pages/comingSoonPage/comingSoonPage.jsx'
import DocumentsPage from './pages/documentsPage/documentsPage.jsx'
import SettingsPage from './pages/settingsPage/settingsPage.jsx'
import DeliverablesPage from './pages/deliverablesPage/deliverablesPage.jsx'
import ReviewPage from './pages/reviewPage/reviewPage.jsx'
import PublicReviewPage from './pages/reviewPage/publicReviewPage.jsx'
import BillingPage from './pages/billingsPage/billingsPage.jsx'
import NotificationsPage from './pages/notificationsPage/notificationsPage.jsx'
import ProfileSettingsPage from './pages/profileSettingsPage/profileSettingsPage.jsx'
import WorkspaceSettingsPage from './pages/workspaceSettingsPage/workspaceSettingsPage.jsx'
import ProjectProfilePage from './pages/projectProfilePage/projectProfilePage.jsx'
import TaskProfilePage from './pages/taskProfilePage/taskProfilePage.jsx'

import LoginPage from './pages/loginPage/loginPage.jsx'
import SignupPage from './pages/signupPage/signupPage.jsx'
import ForgotPasswordPage from './pages/forgotPasswordPage/forgotPasswordPage.jsx'
import ResetPasswordPage from './pages/resetPasswordPage/resetPasswordPage.jsx'
import NotificationSettingsPage from './pages/notificationSettingsPage/notificationSettingsPage.jsx'
import AdminWaitlistPage from './pages/adminWaitlistPage/adminWaitlistPage.jsx'

import HomeRoute from './components/routing/homeRoute/homeRoute.jsx'

function App() {
  return (
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
        element={<PublicReviewPage />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
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
    </Routes>
  )
}

export default App