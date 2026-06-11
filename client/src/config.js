// In production the client is always served from the same Express server,
// so window.location.origin is always correct regardless of build-time env vars.
// The VITE_SERVER_URL env var is only needed for local dev pointing at a separate server.
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001')
