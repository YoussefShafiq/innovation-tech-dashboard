/**
 * Innovation Tech API — matches Postman `innovation-tech.json`:
 * `{{base_url}}/api/admin/auth/...` (e.g. base_url = http://localhost:8000)
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'https://api.xeron.tech').replace(/\/$/, '')

export const BASE_URL = `${API_ORIGIN}/api/admin`

export const AUTH = {
  login: `${BASE_URL}/auth/login`,
  logout: `${BASE_URL}/auth/logout`,
  profile: `${BASE_URL}/auth/profile`,
  refresh: `${BASE_URL}/auth/refresh`,
  settingsRequestUpdate: `${BASE_URL}/auth/settings/request-update`,
  /** Not in Postman export; kept for profile save flow if backend supports it */
  settingsConfirmUpdate: `${BASE_URL}/auth/settings/confirm-update`,
}

/** GET /api/admin/auth/profile — body may nest under `admin` or `user` */
export function getAccountFromProfileResponse(res) {
  const inner = res?.data?.data
  if (!inner) return null
  return inner.admin ?? inner.user ?? null
}

export function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('userToken')}` }
}

/** Postman: Admin Dashboard → Users (`/api/admin/users`, …) */
export const USERS = {
  list: `${BASE_URL}/users`,
  create: `${BASE_URL}/users`,
  update: (encodedId) => `${BASE_URL}/users/${encodeURIComponent(encodedId)}`,
  delete: (encodedId) => `${BASE_URL}/users/${encodeURIComponent(encodedId)}`,
  toggleActive: (encodedId) => `${BASE_URL}/users/${encodeURIComponent(encodedId)}/toggle-active`,
  bulkDelete: `${BASE_URL}/users/bulk/delete`,
}

/** GET /permissions, POST /permissions/assign/{encodedId} */
export const PERMISSIONS_API = {
  list: `${BASE_URL}/permissions`,
  assign: (encodedId) => `${BASE_URL}/permissions/assign/${encodeURIComponent(encodedId)}`,
}

/**
 * Postman: Services — multipart POST create; POST `{id}` update; PATCH toggle-active; DELETE
 * (Update uses POST + multipart, not `_method` PUT, on this API.)
 */
export const SERVICES = {
  list: `${BASE_URL}/services`,
  detail: (encodedId) => `${BASE_URL}/services/${encodeURIComponent(encodedId)}`,
  create: `${BASE_URL}/services`,
  update: (encodedId) => `${BASE_URL}/services/${encodeURIComponent(encodedId)}`,
  delete: (encodedId) => `${BASE_URL}/services/${encodeURIComponent(encodedId)}`,
  toggleActive: (encodedId) =>
    `${BASE_URL}/services/${encodeURIComponent(encodedId)}/toggle-active`,
}

/** Postman: List GET, Delete DELETE — no GET-by-id on this API */
export const CONTACTS = {
  list: `${BASE_URL}/contacts`,
  delete: (encodedId) => `${BASE_URL}/contacts/${encodeURIComponent(encodedId)}`,
}

/** Postman: GET + PUT JSON global site settings (`/api/admin/settings`) */
export const SETTINGS = {
  resource: `${BASE_URL}/settings`,
}
