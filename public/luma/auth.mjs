const config = window.LUMA_CONFIG || {}
const url = String(config.apiBaseUrl || '').replace(/\/$/, '')
const usesNgrok = url && /\.ngrok-free\.(dev|app)$/.test(new URL(url).hostname)
const SESSION_KEY = 'luma-auth-v2'
let session = null

export const configured = Boolean(url)

function keepSession(value) {
  session = value
  if (value) localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  else localStorage.removeItem(SESSION_KEY)
}

function accessToken() {
  if (!session) {
    try {
      session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      session = null
    }
  }
  if (!session?.access_token || session.expires_at * 1000 <= Date.now()) {
    keepSession(null)
    return null
  }
  return session.access_token
}

async function request(path, { method = 'GET', body, anonymous = false } = {}) {
  const token = anonymous ? null : accessToken()
  const response = await fetch(`${url}${path}`, {
    method,
    credentials: 'omit',
    headers: {
      ...(usesNgrok ? { 'ngrok-skip-browser-warning': '1' } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && !anonymous) keepSession(null)
    throw new Error(data.error || 'Richiesta non riuscita.')
  }
  return data
}

export function register({ email, password, displayName }) {
  return request('/api/auth/register', {
    method: 'POST',
    anonymous: true,
    body: { email, password, displayName },
  })
}

export async function signIn({ email, password }) {
  const value = await request('/api/auth/login', {
    method: 'POST',
    anonymous: true,
    body: { email, password },
  })
  keepSession(value)
  return value
}

export function signOut() {
  const pending = request('/api/auth/logout', { method: 'POST', body: {} })
  keepSession(null)
  return pending.catch(() => {})
}

export function currentPlayer() {
  if (!accessToken()) return Promise.resolve(null)
  return request('/api/auth/me')
}

export async function loadProgress() {
  return (await request('/api/progress')).progress
}

export function saveProgress(_userId, progress) {
  // The server derives account ownership from the session, never from client IDs.
  return request('/api/progress', { method: 'PUT', body: { progress } })
}

export function listPlayers(offset = 0) {
  return request(`/api/admin/players?offset=${encodeURIComponent(offset)}`)
}

export function setPlayerApproval(id, approvalStatus) {
  return request(`/api/admin/players/${encodeURIComponent(id)}`, {
    method: 'POST',
    body: { approval_status: approvalStatus },
  })
}
