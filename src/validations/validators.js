// Validadores puros: reciben el valor y devuelven { valido, mensaje }.

import {
  regexLetras,
  regexNumeros,
  regexCorreo,
  regexRut9,
  regexClaveSegura,
} from './regex.js'

const error = (mensaje) => ({ valido: false, mensaje })
const exito = (mensaje = '') => ({ valido: true, mensaje })

// ── Normalizadores ────────────────────────────────────────────────────────

export const normalizarRut = (valor) => valor.trim().toUpperCase().slice(0, 9)
export const normalizarTelefono = (valor) => valor.trim().slice(0, 8)

// ── Campos de texto ───────────────────────────────────────────────────────

const validarSoloLetras = (valor, mensajeObligatorio) => {
  const v = valor.trim()
  if (v === '') return error(mensajeObligatorio)
  if (v.length > 100) return error('Máximo 100 caracteres.')
  if (!regexLetras.test(v)) return error('Usa solo letras.')
  return exito()
}

export const validarNombre   = (valor) => validarSoloLetras(valor, 'El nombre es obligatorio.')
export const validarApellido = (valor) => validarSoloLetras(valor, 'El apellido es obligatorio.')

export const validarTelefono = (valor) => {
  const v = valor.trim()
  if (v === '') return error('El número es obligatorio.')
  if (!regexNumeros.test(v)) return error('Ingresa solo números.')
  if (v.length < 8) return error(`Faltan ${8 - v.length} dígitos.`)
  if (v.length > 8) return error('Máximo 8 dígitos.')
  return exito()
}

// ── Correo ────────────────────────────────────────────────────────────────

export const validarCorreo = (valor) => {
  const v = valor.trim()
  if (v === '') return error('El correo es obligatorio.')
  if (v.length > 254) return error('El correo es demasiado largo.')
  if (!regexCorreo.test(v)) return error('Dominio inválido.')
  return exito()
}

export const validarCorreoLogin = (valor) => {
  const v = valor.trim()
  if (v === '') return error('Ingrese su correo.')
  if (!regexCorreo.test(v)) return error('Formato inválido.')
  return exito()
}

// ── RUT ───────────────────────────────────────────────────────────────────

export const validarRut = (valor) => {
  const v = valor.trim().toUpperCase()
  if (v === '') return error('El RUT es obligatorio.')
  if (v.length < 9) return error(`Faltan ${9 - v.length} caracteres.`)
  if (v.length > 9) return error('RUT demasiado largo.')
  if (!regexRut9.test(v)) return error('Formato inválido (Ej: 12345678K).')
  return exito('¡RUT válido!')
}

// ── Contraseñas ───────────────────────────────────────────────────────────

export const validarClave = (valor) => {
  if (valor === '') return error('La contraseña es obligatoria.')
  if (valor.length < 4) return error('Mínimo 4 caracteres.')
  if (valor.length > 100) return error('Máximo 100 caracteres.')
  if (!regexClaveSegura.test(valor)) return error('Falta 1 mayúscula y 1 número.')
  return exito('¡Contraseña segura!')
}

export const validarClaveLogin = (valor) => {
  if (valor === '') return error('La contraseña es requerida.')
  if (valor.length < 4) return error('Mínimo 4 caracteres.')
  return exito()
}

export const validarRepetirClave = (repetida, original) => {
  if (repetida === '') return error('Repita la contraseña.')
  if (repetida !== original) return error('No coinciden.')
  if (!validarClave(original).valido) return error('Arregle la original primero.')
  return exito('¡Coinciden!')
}
