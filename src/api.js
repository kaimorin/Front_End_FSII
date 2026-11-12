import { API_URL } from './config'

export function guardarSesion(datos) {
  localStorage.setItem('token', datos.token)
  localStorage.setItem('usuario', JSON.stringify(datos))
}

export function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

export function obtenerUsuario() {
  const u = localStorage.getItem('usuario')
  return u ? JSON.parse(u) : null
}

// Igual que fetch, pero agrega el token y el Content-Type solo
export function apiFetch(ruta, opciones = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...opciones.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${API_URL}${ruta}`, { ...opciones, headers })
}

// Convierte cualquier RUT (12345678K, 12.345.678-K, 12345678-K) al formato del back: 12.345.678-K
export function formatearRut(rut) {
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
}