import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
const apiGet = (path) => fetch(`/api${path}`)

const DOCTORES_BASE = [
  { id: 1, nombre: 'Maria de Judas', especialidad: 'Nutrición Clínica', modalidad: 'Presencial y Online', precioBase: 35000 },
  { id: 2, nombre: "Maximo Tul 'Onazzo", especialidad: 'Nutrición Deportiva', modalidad: 'Presencial', precioBase: 35000 },
  { id: 3, nombre: "Tomas O'valle", especialidad: 'Nutrición Infantil', modalidad: 'Online', precioBase: 35000 },
  { id: 4, nombre: "Shaqueal O'neal", especialidad: 'Control de Peso', modalidad: 'Presencial y Online', precioBase: 35000 },
]

const HORAS = ['10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']
const MODALIDADES = ['Presencial', 'Online', 'Presencial y Online']

function fechaAISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fechaBonita(date) {
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Agenda() {
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState(DOCTORES_BASE)
  const [doctorId, setDoctorId] = useState('')
  const [modalidad, setModalidad] = useState('Online')
  const [fechaISO, setFechaISO] = useState('')
  const [hora, setHora] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const res = await apiGet('/especialistas/activos')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setDoctores(data)
          }
        }
      } catch {
        // Si falla el back, seguimos con DOCTORES_BASE
      }
    }
    cargar()
  }, [])

  const doctorSeleccionado = doctores.find((d) => String(d.id) === String(doctorId))

  const handleContinuar = () => {
    setError('')
    if (!doctorSeleccionado) {
      setError('Selecciona un especialista.')
      return
    }
    if (!fechaISO) {
      setError('Selecciona una fecha.')
      return
    }
    if (!hora) {
      setError('Selecciona una hora.')
      return
    }

    const fechaObj = new Date(fechaISO + 'T12:00:00')
    const fechaTexto = fechaBonita(fechaObj)

    const cita = {
      especialistaId: Number(doctorSeleccionado.id),
      doctor: doctorSeleccionado.nombre,
      especialidad: doctorSeleccionado.especialidad,
      modalidad,
      fecha: fechaTexto,
      fechaISO,
      hora,
      precioBase: Number(doctorSeleccionado.precioBase) || 35000,
    }

    sessionStorage.setItem('cita', JSON.stringify(cita))
    navigate('/datos')
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>Agenda tu hora</h1>
      <p>Selecciona especialista, modalidad, fecha y hora.</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <label>Especialista</label>
      <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 16 }}>
        <option value="">-- Elige un especialista --</option>
        {doctores.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre} - {d.especialidad}
          </option>
        ))}
      </select>

      <label>Modalidad</label>
      <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 16 }}>
        {MODALIDADES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <label>Fecha</label>
      <input
        type="date"
        value={fechaISO}
        onChange={(e) => setFechaISO(e.target.value)}
        style={{ display: 'block', width: '100%', padding: 10, marginBottom: 16 }}
      />

      <label>Hora</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {HORAS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHora(h)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              background: hora === h ? '#0a7a42' : '#fff',
              color: hora === h ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            {h}
          </button>
        ))}
      </div>

      <button onClick={handleContinuar} style={{ padding: '12px 20px', background: '#0a7a42', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        Continuar
      </button>
    </div>
  )
}