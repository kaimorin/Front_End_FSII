import { useMemo, useSyncExternalStore } from 'react'
import { API_URL } from './config'

// ── Gestión de sesión ──────────────────────────────────────────────────────

function avisarCambioSesion() {
  window.dispatchEvent(new Event('sesion'))
}

export function guardarSesion(datos) {
  // accessToken en memoria (no en localStorage) → protege contra XSS
  _accessToken = datos.accessToken
  // Solo guardamos en localStorage lo no sensible + el refreshToken
  const sesion = {
    id:           datos.id,
    nombre:       datos.nombre,
    apellido:     datos.apellido,
    correo:       datos.correo,
    rol:          datos.rol,
    refreshToken: datos.refreshToken,
  }
  localStorage.setItem('sesion', JSON.stringify(sesion))
  avisarCambioSesion()
}

export function cerrarSesion() {
  _accessToken = null
  localStorage.removeItem('sesion')
  avisarCambioSesion()
}

export function salir() {
  const sesion = obtenerUsuario()
  if (sesion?.refreshToken) {
    // Revoca el refresh token en el backend (best-effort, no bloqueante)
    fetch(`${API_URL}/usuarios/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: sesion.refreshToken }),
    }).catch(() => {})
  }
  cerrarSesion()
  sessionStorage.clear()
}

export function obtenerUsuario() {
  try {
    const u = localStorage.getItem('sesion')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

// Hook reactivo para componentes
function suscribir(aviso) {
  window.addEventListener('sesion', aviso)
  window.addEventListener('storage', aviso)
  return () => {
    window.removeEventListener('sesion', aviso)
    window.removeEventListener('storage', aviso)
  }
}

export function useUsuario() {
  const texto = useSyncExternalStore(suscribir, () => localStorage.getItem('sesion'))
  return useMemo(() => {
    if (!texto) return null
    try { return JSON.parse(texto) } catch { return null }
  }, [texto])
}

// ── Token en memoria (evita XSS directo al accessToken) ───────────────────

let _accessToken = null

function obtenerAccessToken() {
  return _accessToken
}

// ── Renovación automática de token ────────────────────────────────────────

let _renovando = null   // promesa en vuelo para evitar renovaciones paralelas

async function renovarToken() {
  if (_renovando) return _renovando
  const sesion = obtenerUsuario()
  if (!sesion?.refreshToken) { cerrarSesion(); return null }

  _renovando = fetch(`${API_URL}/usuarios/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: sesion.refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) { cerrarSesion(); return null }
      const { accessToken } = await res.json()
      _accessToken = accessToken
      return accessToken
    })
    .catch(() => { cerrarSesion(); return null })
    .finally(() => { _renovando = null })

  return _renovando
}

// ── Cliente HTTP ───────────────────────────────────────────────────────────


export async function apiFetch(ruta, opciones = {}, _reintento = false) {
  const token = obtenerAccessToken()
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',   // protección ligera contra CSRF en CORS simple
    ...opciones.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${ruta}`, { ...opciones, headers })

  // Reintento automático con refresh token (una sola vez)
  if (res.status === 401 && !_reintento) {
    const nuevoToken = await renovarToken()
    if (nuevoToken) return apiFetch(ruta, opciones, true)
    cerrarSesion()
  }

  return res
}


export async function apiGet(ruta) {
  try {
    const res = await apiFetch(ruta)
    if (res.status === 401 || res.status === 403) { cerrarSesion(); return null }
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

// ── Utilidades ────────────────────────────────────────────────────────────

/** Convierte cualquier RUT al formato del back: 12.345.678-K */
export function formatearRut(rut) {
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
}
