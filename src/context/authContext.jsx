import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import api, { refreshAccessToken } from '../api/apiClient.js'

import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  SESSION_EXPIRED_EVENT,
} from '../utils/sessionKeys.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearStoredSession = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(
      REFRESH_TOKEN_KEY,
    )
    localStorage.removeItem(USER_KEY)
  }

  const storeSession = ({
    accessToken,
    refreshToken,
    user,
    workspace,
  }) => {
    if (accessToken) {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        accessToken,
      )
    }

    if (refreshToken) {
      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        refreshToken,
      )
    }

    if (user) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(user),
      )

      setUser(user)
    }

    setWorkspace(workspace || null)
  }

  // Refreshing uses the shared single-flight
  // refreshAccessToken() exported by the
  // apiClient. The backend rotates refresh
  // tokens on every use, so a second,
  // uncoordinated refresh here would race the
  // apiClient's own 401 handling (data
  // providers fetch before this effect runs)
  // and fail with a stale token, wiping a
  // perfectly valid session.

  useEffect(() => {
    const restoreSession = async () => {
      const token =
        localStorage.getItem(ACCESS_TOKEN_KEY)

      const refreshToken =
        localStorage.getItem(
          REFRESH_TOKEN_KEY,
        )

      if (!token && !refreshToken) {
        setIsLoading(false)
        return
      }

      try {
        let authenticatedToken = token

        try {
          const response =
            await api.get('/auth/me')

          const authenticatedUser =
            response?.data?.user ||
            null

          const authenticatedWorkspace =
            response?.data?.workspace ||
            null

          if (!authenticatedUser) {
            throw new Error(
              'Invalid session response.',
            )
          }

          setUser(authenticatedUser)
          setWorkspace(
            authenticatedWorkspace,
          )

          localStorage.setItem(
            USER_KEY,
            JSON.stringify(
              authenticatedUser,
            ),
          )

          setIsLoading(false)
          return
        } catch (error) {
          if (
            error.status !== 401 ||
            !refreshToken
          ) {
            throw error
          }
        }

        authenticatedToken =
          await refreshAccessToken()

        if (!authenticatedToken) {
          throw new Error(
            'Unable to restore session.',
          )
        }

        const response =
          await api.get('/auth/me')

        const authenticatedUser =
          response?.data?.user ||
          null

        const authenticatedWorkspace =
          response?.data?.workspace ||
          null

        if (!authenticatedUser) {
          throw new Error(
            'Invalid session response.',
          )
        }

        setUser(authenticatedUser)
        setWorkspace(
          authenticatedWorkspace,
        )

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(
            authenticatedUser,
          ),
        )
      } catch (error) {
        console.error(
          'Session restoration failed:',
          error,
        )

        setUser(null)
        setWorkspace(null)

        // Only wipe the stored session when the
        // server rejected the refresh token as
        // invalid or expired. Transient failures
        // (network errors, 5xx) keep the tokens
        // so the next load can restore normally.
        if (error.status === 401) {
          clearStoredSession()
        }
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // The apiClient clears stored tokens when a
  // refresh fails and notifies via event so
  // auth state resets without a circular
  // import.
  useEffect(() => {
    const handleSessionExpired = () => {
      clearStoredSession()

      setUser(null)
      setWorkspace(null)
      setIsLoading(false)
    }

    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      handleSessionExpired,
    )

    return () => {
      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      )
    }
  }, [])

  const login = async ({
    email,
    password,
  }) => {
    const response = await api.post(
      '/auth/login',
      {
        email,
        password,
      },
    )

    const result =
      response?.data ||
      response

    const accessToken =
      result?.accessToken

    const refreshToken =
      result?.refreshToken

    const authenticatedUser =
      result?.user || null

    const authenticatedWorkspace =
      result?.workspace || null

    if (!accessToken) {
      throw new Error(
        'Authentication succeeded but no access token was returned.',
      )
    }

    storeSession({
      accessToken,
      refreshToken,
      user: authenticatedUser,
      workspace: authenticatedWorkspace,
    })

    return {
      user: authenticatedUser,
      workspace: authenticatedWorkspace,
    }
  }

  const signup = async ({
    firstName,
    lastName,
    email,
    password,
    workspaceName,
  }) => {
    const response = await api.post(
      '/auth/register',
      {
        firstName,
        lastName,
        email,
        password,
        workspaceName,
      },
    )

    const result =
      response?.data ||
      response

    const accessToken =
      result?.accessToken

    const refreshToken =
      result?.refreshToken

    const authenticatedUser =
      result?.user || null

    const authenticatedWorkspace =
      result?.workspace || null

    if (!accessToken) {
      throw new Error(
        'Account created but no access token was returned.',
      )
    }

    storeSession({
      accessToken,
      refreshToken,
      user: authenticatedUser,
      workspace: authenticatedWorkspace,
    })

    return {
      user: authenticatedUser,
      workspace: authenticatedWorkspace,
    }
  }

  const logout = async () => {
    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY)

    try {
      if (token) {
        await api.post('/auth/logout')
      }
    } catch {
      // Local logout still happens
      // if the server request fails.
    }

    clearStoredSession()

    setUser(null)
    setWorkspace(null)
  }

  const value = {
    user,
    workspace,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    signup,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}