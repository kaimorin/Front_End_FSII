const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export const PRECIO_CITA = 35000 // precio de respaldo; cada especialista puede definir su propio valor en el back
export const ESTADOS = ['Pendiente', 'Confirmado', 'Atendido', 'Cancelado']

export const ESPECIALIDADES = {
  'nutricion-clinica': 'Nutrición Clínica',
  'nutricion-deportiva': 'Nutrición Deportiva',
  'salud-digestiva': 'Salud Digestiva',
  'control-peso': 'Control de Peso',
}

// Agenda guarda "control-peso"; aquí se convierte a "Control de Peso"
export function nombreEspecialidad(valor) {
  return ESPECIALIDADES[valor] || valor || ''
}

const COMUNAS = {
  santiago: 'Santiago',
  providencia: 'Providencia',
  'las-condes': 'Las Condes',
  otra: 'Otra',
}

// Datos guarda "las-condes"; aquí se convierte a "Las Condes"
export function nombreComuna(valor) {
  return COMUNAS[valor] || valor || ''
}

export function dinero(n) {
  return '$' + Number(n || 0).toLocaleString('en-US')
}

// Calcula los importes visibles en el resumen. El backend repite este cálculo
// usando el precio guardado para el especialista y es la fuente definitiva.
export function calcularTotales(precioBase = PRECIO_CITA, descuento = 0) {
  const base = Math.max(Number(precioBase) || PRECIO_CITA, 0)
  const rebaja = Math.min(Math.max(Number(descuento) || 0, 0), base)
  const subtotal = base - rebaja
  const iva = Math.round(subtotal * 0.19)
  return { precioBase: base, descuento: rebaja, subtotal, iva, total: subtotal + iva }
}

// Para citas nuevas usa el total guardado por el backend. En registros antiguos
// calcula el importe a partir del precio base que ya existía.
export function totalCita(cita) {
  if (Number(cita?.total) > 0) return Number(cita.total)
  return calcularTotales(cita?.precioBase || PRECIO_CITA).total
}

export function claseEstado(estado) {
  if (estado === 'Confirmado') return 'badge badge-progreso'
  if (estado === 'Atendido') return 'badge badge-finalizado'
  if (estado === 'Cancelado') return 'badge badge-cancelado'
  return 'badge badge-pendiente'
}

// "Lunes, 10 de marzo de 2025": el mismo formato que guarda Agenda.jsx
export function fechaLarga(fecha) {
  return `${DIAS[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`
}

// true si el texto de la fecha de la cita es del mes actual
export function esDelMes(textoFecha, hoy = new Date()) {
  return String(textoFecha).includes(`de ${MESES[hoy.getMonth()]} de ${hoy.getFullYear()}`)
}

// Para los buscadores: true si el texto aparece en alguno de los campos
export function coincide(busqueda, campos) {
  return campos.join(' ').toLowerCase().includes(busqueda.trim().toLowerCase())
}
