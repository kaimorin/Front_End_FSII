import { useEffect, useState } from 'react'
import { apiFetch, apiGet } from '../api'
import { coincide, nombreEspecialidad } from '../utils/formato'

function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [citas, setCitas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const [listaPacientes, listaCitas] = await Promise.all([apiGet('/pacientes'), apiGet('/citas')])
        if (!listaPacientes) {
          setError('No se pudieron cargar los pacientes.')
          return
        }
        setPacientes(listaPacientes)
        setCitas(listaCitas || [])
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
    }
    cargar()
  }, [])

  // El servicio del paciente es la especialidad de su última cita
  function servicioDe(rut) {
    const suyas = citas.filter((c) => c.pacienteRut === rut).sort((a, b) => b.id - a.id)
    return suyas.length > 0 ? nombreEspecialidad(suyas[0].especialidad) : '—'
  }

  async function eliminar(p) {
    if (!window.confirm(`¿Eliminar a ${p.nombre} ${p.apellido}?`)) return
    setError('')
    try {
      const res = await apiFetch(`/pacientes/${p.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('No se pudo eliminar al paciente.')
        return
      }
      setPacientes((lista) => lista.filter((x) => x.id !== p.id))
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  const visibles = pacientes.filter((p) => coincide(busqueda, [p.nombre, p.apellido, p.rut]))

  return (
    <main className="main-dashboard">
      <header className="topbar-admin">
        <div>
          <h1 className="saludo-admin">Pacientes</h1>
          <p className="subtitulo-admin">Listado de pacientes registrados</p>
        </div>
        <div className="buscador-admin">
          <input
            type="text"
            placeholder="Buscar paciente o RUT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </header>

      {error && <p className="msg-admin-error">{error}</p>}

      <section className="seccion-tabla-admin">
        <div className="tabla-admin-contenedor">
          <table className="tabla-admin">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Teléfono</th>
                <th>Servicio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.id}>
                  <td>{`${p.nombre} ${p.apellido}`}</td>
                  <td>{p.rut}</td>
                  <td>{p.telefono}</td>
                  <td>{servicioDe(p.rut)}</td>
                  <td><button className="btn-accion-tabla" onClick={() => eliminar(p)}>Eliminar</button></td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan="5">No hay pacientes para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Pacientes
