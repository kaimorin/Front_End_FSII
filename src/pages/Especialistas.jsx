import { useEffect, useState } from 'react'
import { apiFetch, apiGet } from '../api'

const NUEVO = {
  nombre: '',
  especialidad: 'Nutrición Clínica',
  modalidad: 'Presencial',
  descripcion: '',
  activo: true,
}

function Especialistas() {
  const [especialistas, setEspecialistas] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState(NUEVO)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const lista = await apiGet('/especialistas')
        if (!lista) {
          setError('No se pudieron cargar los especialistas.')
          return
        }
        setEspecialistas(lista)
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
    }
    cargar()
  }, [])

  function cambiar(e) {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value })
  }

  // POST /api/especialistas (solo ADMIN)
  async function crear(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await apiFetch('/especialistas', { method: 'POST', body: JSON.stringify(nuevo) })
      if (!res.ok) {
        setError('No se pudo crear el especialista. Revisa los datos.')
        return
      }
      const creado = await res.json()
      setEspecialistas((lista) => [...lista, creado])
      setNuevo(NUEVO)
      setMostrarForm(false)
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  // PUT /api/especialistas/{id}: activa o desactiva (los desactivados no salen en la Agenda)
  async function cambiarActivo(esp) {
    setError('')
    try {
      const res = await apiFetch(`/especialistas/${esp.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: esp.nombre,
          especialidad: esp.especialidad,
          modalidad: esp.modalidad,
          descripcion: esp.descripcion,
          activo: !esp.activo,
        }),
      })
      if (!res.ok) {
        setError('No se pudo actualizar el especialista.')
        return
      }
      const actualizado = await res.json()
      setEspecialistas((lista) => lista.map((x) => (x.id === esp.id ? actualizado : x)))
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  async function eliminar(esp) {
    if (!window.confirm(`¿Eliminar a ${esp.nombre}?`)) return
    setError('')
    try {
      const res = await apiFetch(`/especialistas/${esp.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('No se pudo eliminar al especialista.')
        return
      }
      setEspecialistas((lista) => lista.filter((x) => x.id !== esp.id))
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  return (
    <main className="main-dashboard">
      <header className="topbar-admin">
        <div>
          <h1 className="saludo-admin">Especialistas</h1>
          <p className="subtitulo-admin">Equipo de profesionales</p>
        </div>
      </header>

      {error && <p className="msg-admin-error">{error}</p>}

      <section className="seccion-tabla-admin">
        <div className="cabecera-tabla-admin">
          <h2>Equipo</h2>
          <button className="btn-nueva-cita" onClick={() => setMostrarForm(!mostrarForm)}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo Especialista'}
          </button>
        </div>

        {mostrarForm && (
          <form className="form-admin-inline" onSubmit={crear}>
            <input name="nombre" placeholder="Nombre*" required value={nuevo.nombre} onChange={cambiar} />
            <select name="especialidad" aria-label="Especialidad" value={nuevo.especialidad} onChange={cambiar}>
              <option>Nutrición Clínica</option>
              <option>Nutrición Deportiva</option>
              <option>Salud Digestiva</option>
              <option>Control de Peso</option>
            </select>
            <select name="modalidad" aria-label="Modalidad" value={nuevo.modalidad} onChange={cambiar}>
              <option>Presencial</option>
              <option>Online</option>
              <option>Presencial y Online</option>
            </select>
            <input name="descripcion" placeholder="Descripción" value={nuevo.descripcion} onChange={cambiar} />
            <button type="submit" className="btn-accion-tabla">Guardar especialista</button>
          </form>
        )}

        <div className="tabla-admin-contenedor">
          <table className="tabla-admin">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {especialistas.map((e) => (
                <tr key={e.id}>
                  <td>{e.nombre}</td>
                  <td>{e.especialidad}</td>
                  <td>{e.modalidad}</td>
                  <td>{e.activo ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button className="btn-accion-tabla" onClick={() => cambiarActivo(e)}>
                      {e.activo ? 'Desactivar' : 'Activar'}
                    </button>{' '}
                    <button className="btn-accion-tabla" onClick={() => eliminar(e)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {especialistas.length === 0 && (
                <tr>
                  <td colSpan="5">No hay especialistas registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Especialistas
