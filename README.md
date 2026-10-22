# Required environment variables for the Rayern frontend

## API base URL

The client calls the Rayern backend API directly (it is not proxied through the
Vite dev server in production). The backend origin is resolved at build time by
`VITE_API_URL`, and the client appends the API version prefix `/api/v1` to every
request.

Do **not** include `/api/v1` in `VITE_API_URL` itself. If you do, requests will
be sent to `.../api/v1/api/v1/...` and return 404.

### Production

```
VITE_API_URL=https://rayern-backend.onrender.com
```

This must be set in the production build/deploy environment so the built bundle
requests the real backend origin. If this is not set, the client falls back to
the same backend origin and still appends `/api/v1` itself, so a missing variable
no longer causes relative-path requests against the frontend origin.

### Local development

For local development against a self-hosted backend:

```
VITE_API_URL=http://localhost:5000
```

With that set, `npm run dev` will request `http://localhost:5000/api/v1/...`.

## Notes

- The origin is baked into the static build; changing it requires a new build and
  deploy, not just a runtime env change.
- The `/api/v1` prefix is appended by the shared client in
  `client/src/api/apiClient.js` and is not configurable per-request.
- Edit `client/src/api/apiClient.js` only if you intentionally want to change
  the backend origin or the API path convention. The canonical backend paths are
  defined by the Express route tree in `server/src/routes/index.js` and each
  feature router under `server/src/routes/`.
