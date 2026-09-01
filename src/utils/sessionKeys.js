export const ACCESS_TOKEN_KEY = 'rayern_access_token'
export const REFRESH_TOKEN_KEY = 'rayern_refresh_token'
export const USER_KEY = 'rayern_user'

export const SESSION_EXPIRED_EVENT = 'rayern:session-expired'

const LEGACY_SESSION_KEYS = {
  klientbond_access_token: ACCESS_TOKEN_KEY,
  klientbond_refresh_token: REFRESH_TOKEN_KEY,
  klientbond_user: USER_KEY,
}

// One-time rebrand migration: sessions persisted under the
// previous KlientBond keys are copied to the Rayern keys and
// the old entries are removed, so existing users stay signed
// in. Safe to run repeatedly — values are never overwritten
// and nothing is logged.
export function migrateLegacySessionKeys() {
  if (typeof localStorage === 'undefined') {
    return
  }

  Object.entries(
    LEGACY_SESSION_KEYS,
  ).forEach(([legacyKey, currentKey]) => {
    const legacyValue = localStorage.getItem(
      legacyKey,
    )

    if (legacyValue === null) {
      return
    }

    const currentValue = localStorage.getItem(
      currentKey,
    )

    if (currentValue === null) {
      localStorage.setItem(
        currentKey,
        legacyValue,
      )
    }

    localStorage.removeItem(legacyKey)
  })
}
