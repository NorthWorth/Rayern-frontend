import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_EXPIRED_EVENT,
  migrateLegacySessionKeys,
} from '../utils/sessionKeys.js'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://rayern-backend.onrender.com/api/v1'

// Move any pre-rebrand KlientBond storage
// keys to their Rayern equivalents before
// anything reads session state.
migrateLegacySessionKeys()

// Shared in-flight refresh promise so that
// concurrent 401s trigger exactly ONE
// /auth/refresh request.
let refreshPromise = null

function setTokens(accessToken, refreshToken) {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken,
  )

  if (refreshToken) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      refreshToken,
    )
  }
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(
    REFRESH_TOKEN_KEY,
  )
}

async function performRefresh(retriedStale = false) {
  const refreshToken =
    localStorage.getItem(
      REFRESH_TOKEN_KEY,
    )

  if (!refreshToken) {
    const error = new Error(
      'No refresh token available.',
    )

    error.status = 401

    throw error
  }

  const response = await fetch(
    `${API_URL}/auth/refresh`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    },
  )

  const data = await response
    .json()
    .catch(() => ({}))

  if (!response.ok) {
    // The backend rotates refresh tokens, so
    // another tab may have already consumed
    // the token this attempt used. If storage
    // now holds a different token, retry once
    // with it before treating the session as
    // dead.
    const latestRefreshToken =
      localStorage.getItem(
        REFRESH_TOKEN_KEY,
      )

    const consumedElsewhere =
      latestRefreshToken &&
      latestRefreshToken !== refreshToken

    if (response.status === 401 && !retriedStale) {
      if (consumedElsewhere) {
        return performRefresh(true)
      }

      // A 401 while storage still holds the very
      // token we just sent means the server saw a
      // session document that predates our own
      // last rotation (transient replication lag),
      // not a genuinely dead token. Retry once
      // with the same token; the second read sees
      // the committed hash and either rotates or
      // rejects for real. Bounded by retriedStale
      // so this can never loop.
      return performRefresh(true)
    }

    const error = new Error(
      data?.error?.message ||
        data?.message ||
        'Unable to refresh session.',
    )

    error.status = response.status

    throw error
  }

  const result = data?.data || data

  const accessToken = result?.accessToken
  const newRefreshToken =
    result?.refreshToken

  if (!accessToken) {
    const error = new Error(
      'Refresh succeeded but no access token was returned.',
    )

    error.status = response.status

    throw error
  }

  setTokens(accessToken, newRefreshToken)

  return accessToken
}

// Shared single-flight entry point. AuthContext
// awaits this same promise during session
// restoration so concurrent 401s from data
// providers and /auth/me trigger exactly one
// rotating refresh instead of racing.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh()
      .catch((error) => {
        // Only clear the session and force a
        // logout when the server rejected the
        // refresh token itself. Transient
        // failures (network errors, 5xx) keep
        // the stored session so the next
        // request can retry the refresh.
        if (error.status === 401) {
          clearStoredSession()

          window.dispatchEvent(
            new CustomEvent(
              SESSION_EXPIRED_EVENT,
            ),
          )
        }

        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function request(
  path,
  options = {},
  hasRetried = false,
) {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY)

  const headers = {
    ...(options.body instanceof FormData ||
    options.rawBody
      ? {}
      : {
          'Content-Type': 'application/json',
        }),
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // rawBody is an internal marker only — never
  // forwarded to fetch.
  const fetchOptions = { ...options }

  delete fetchOptions.rawBody

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...fetchOptions,
      headers,
    },
  )

  let data = null

  let blob = null

  if (options.responseType === 'blob') {
    if (response.ok) {
      blob = await response.blob()
    }
  } else {
    try {
      data = await response.json()
    } catch {
      // Non-JSON body — keep data as null.
    }
  }

  // On 401 (never for auth endpoints, never
  // twice for the same request): attempt a
  // single shared refresh, then retry the
  // original request exactly once.
  if (
    response.status === 401 &&
    !hasRetried &&
    !path.startsWith('/auth/')
  ) {
    try {
      await refreshAccessToken()
    } catch {
      // Session cleared + event dispatched;
      // fall through to surface the original
      // 401 once, without looping.
    }

    if (
      localStorage.getItem(ACCESS_TOKEN_KEY)
    ) {
      return request(path, options, true)
    }
  }

  if (!response.ok) {
    let errorData = data

    if (options.responseType === 'blob' && !errorData) {
      // The failed response body was not read in
      // blob mode — try to recover the JSON error.
      try {
        errorData = await response.clone().json()
      } catch {
        // Keep null; the status fallback covers it.
      }
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`

    const error = new Error(message)

    error.status = response.status
    error.code = errorData?.error?.code

    throw error
  }

  if (options.responseType === 'blob') {
    return blob
  }

  return data
}

export const api = {
  get(path, options = {}) {
    return request(path, {
      ...options,
      method: 'GET',
    })
  },

  // Raw binary upload: sends the Blob/File as the
  // request body with its own content type.
  upload(path, file, options = {}) {
    return request(path, {
      ...options,
      method: 'POST',
      rawBody: true,
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        ...(options.headers || {}),
      },
    })
  },

  download(path) {
    return request(path, {
      method: 'GET',
      responseType: 'blob',
    })
  },

  post(path, body, options = {}) {
    return request(path, {
      ...options,
      method: 'POST',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    })
  },

  put(path, body, options = {}) {
    return request(path, {
      ...options,
      method: 'PUT',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    })
  },

  patch(path, body, options = {}) {
    return request(path, {
      ...options,
      method: 'PATCH',
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    })
  },

  delete(path, options = {}) {
    return request(path, {
      ...options,
      method: 'DELETE',
    })
  },
}

export default api
