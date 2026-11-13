import { useMemo, useSyncExternalStore } from 'react'
import { API_URL } from './config'

// Avisa a los componentes (Header, Perfil, etc.) que la sesión cambió
function avisarCambioSesion() {
  window.dispatchEvent(new Event('sesion'))
}

export function guardarSesion(datos) {
  localStorage.setItem('token', datos.token)
  localStorage.setItem('usuario', JSON.stringify(datos))
  avisarCambioSesion()
}

export function cerrarSesion() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  avisarCambioSesion()
}

// Cierra sesión y borra también los datos de la reserva en curso
export function salir() {
  cerrarSesion()
  sessionStorage.clear()
}

export function obtenerUsuario() {
  const u = localStorage.getItem('usuario')
  return u ? JSON.parse(u) : null
}

// Igual que obtenerUsuario, pero hace que el componente se actualice al iniciar o cerrar sesión
function suscribir(aviso) {
  window.addEventListener('sesion', aviso)
  window.addEventListener('storage', aviso)
  return () => {
    window.removeEventListener('sesion', aviso)
    window.removeEventListener('storage', aviso)
  }
}

export function useUsuario() {
  const texto = useSyncExternalStore(suscribir, () => localStorage.getItem('usuario'))
  return useMemo(() => (texto ? JSON.parse(texto) : null), [texto])
}

// Igual que fetch, pero agrega el token y el Content-Type solo
export function apiFetch(ruta, opciones = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...opciones.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${API_URL}${ruta}`, { ...opciones, headers })
}

// GET que devuelve el JSON, o null si el back responde con error (404, 403...).
// Si el token venció (401/403) cierra la sesión.
export async function apiGet(ruta) {
  const res = await apiFetch(ruta)
  if (res.status === 401 || res.status === 403) cerrarSesion()
  return res.ok ? res.json() : null
}

// Convierte cualquier RUT (12345678K, 12.345.678-K, 12345678-K) al formato del back: 12.345.678-K
export function formatearRut(rut) {
  const limpio = String(rut).replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length < 2) return limpio
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
}
