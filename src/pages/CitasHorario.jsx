import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { apiFetch, apiGet } from '../api'
import { claseEstado, ESTADOS, nombreEspecialidad } from '../utils/formato'

function CitasHorarios() {
  const navigate = useNavigate()
  const [citas, setCitas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const lista = await apiGet('/citas')
        if (!lista) {
          setError('No se pudieron cargar las citas.')
          return
        }
        setCitas([...lista].sort((a, b) => b.id - a.id))
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
    }
    cargar()
  }, [])

  // PATCH /api/citas/{id}/estado (solo ADMIN)
  async function cambiarEstado(id, estado) {
    setError('')
    try {
      const res = await apiFetch(`/citas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      })
      if (!res.ok) {
        setError('No se pudo cambiar el estado de la cita.')
        return
      }
      const actualizada = await res.json()
      setCitas((lista) => lista.map((c) => (c.id === id ? actualizada : c)))
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  return (
    <main className="main-dashboard">
      <header className="topbar-admin">
        <div>
          <h1 className="saludo-admin">Citas y Horarios</h1>
          <p className="subtitulo-admin">Agenda de todas las citas</p>
        </div>
      </header>

      {error && <p className="msg-admin-error">{error}</p>}

      <section className="seccion-tabla-admin">
        <div className="cabecera-tabla-admin">
          <h2>Citas</h2>
          <button className="btn-nueva-cita" onClick={() => navigate('/reserva/datos')}>+ Nueva Cita</button>
        </div>

        <div className="tabla-admin-contenedor">
          <table className="tabla-admin">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Especialista</th>
                <th>Especialidad</th>
                <th>Fecha y Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id}>
                  <td>{`${c.pacienteNombre} ${c.pacienteApellido}`}</td>
                  <td>{c.doctor}</td>
                  <td>{nombreEspecialidad(c.especialidad)}</td>
                  <td>{`${c.fecha} - ${c.hora}`}</td>
                  <td>
                    <span className={claseEstado(c.estado)}>{c.estado}</span>{' '}
                    <select
                      className="select-estado"
                      aria-label={`Cambiar estado de la cita ${c.id}`}
                      value={c.estado}
                      onChange={(e) => cambiarEstado(c.id, e.target.value)}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {citas.length === 0 && (
                <tr>
                  <td colSpan="5">Aún no hay citas agendadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default CitasHorarios
