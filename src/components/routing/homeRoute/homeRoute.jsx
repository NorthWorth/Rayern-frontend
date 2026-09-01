import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../context/authContext.jsx'
import LandingPage from '../../../pages/LandingPage/LandingPage.jsx'

function HomeRoute() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth()

  // Wait for session restoration to finish.
  // This prevents the landing page from flashing
  // before an existing session is restored.
  if (isLoading) {
    return null
  }

  // Already authenticated → dashboard.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Not authenticated → public landing page.
  return <LandingPage />
}

export default HomeRoute