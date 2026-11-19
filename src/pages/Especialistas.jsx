import { useEffect, useState } from 'react'
import { apiFetch, apiGet } from '../api'
import { dinero } from '../utils/formato'

const NUEVO = {
  nombre: '',
  especialidad: 'Nutrición Clínica',
  modalidad: 'Presencial',
  descripcion: '',
  precioBase: '35000',
  activo: true,
}

function Especialistas() {
  const [especialistas, setEspecialistas] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [nuevo, setNuevo] = useState(NUEVO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    async function cargar() {
      const lista = await apiGet('/especialistas')
      if (!lista) {
        setError('No se pudieron cargar los especialistas.')
        return
      }
      setEspecialistas(lista)
    }
    cargar()
  }, [])

  function cambiar(e) {
    setNuevo({ ...nuevo, [e.target.name]: e.target.value })
  }

  async function guardar(e) {
    e.preventDefault()
    if (guardando) return
    setError('')
    setGuardando(true)

    try {
      const datos = { ...nuevo, precioBase: Number(nuevo.precioBase) }
      const ruta = editandoId ? `/especialistas/${editandoId}` : '/especialistas'
      const res = await apiFetch(ruta, {
        method: editandoId ? 'PUT' : 'POST',
        body: JSON.stringify(datos),
      })

      if (!res.ok) {
        const respuesta = await res.json().catch(() => ({}))
        setError(respuesta.error || respuesta.detalle || 'No se pudo guardar el especialista. Revisa los datos.')
        return
      }

      const creado = await res.json()
      if (editandoId) {
        setEspecialistas((lista) => lista.map((item) => (item.id === editandoId ? creado : item)))
      } else {
        setEspecialistas((lista) => [...lista, creado])
      }
      setNuevo(NUEVO)
      setEditandoId(null)
      setMostrarForm(false)
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  function editar(especialista) {
    setNuevo({
      nombre: especialista.nombre || '',
      especialidad: especialista.especialidad || 'Nutrición Clínica',
      modalidad: especialista.modalidad || 'Presencial',
      descripcion: especialista.descripcion || '',
      precioBase: String(especialista.precioBase || 35000),
      activo: especialista.activo,
    })
    setEditandoId(especialista.id)
    setMostrarForm(true)
    setError('')
  }

  function abrirFormulario() {
    setNuevo(NUEVO)
    setEditandoId(null)
    setMostrarForm(true)
  }

  function cancelarFormulario() {
    setNuevo(NUEVO)
    setEditandoId(null)
    setMostrarForm(false)
  }

  async function cambiarActivo(especialista) {
    setError('')
    try {
      const res = await apiFetch(`/especialistas/${especialista.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...especialista, activo: !especialista.activo }),
      })
      if (!res.ok) {
        setError('No se pudo actualizar el especialista.')
        return
      }
      const actualizado = await res.json()
      setEspecialistas((lista) => lista.map((item) => (
        item.id === especialista.id ? actualizado : item
      )))
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  async function eliminar(especialista) {
    if (!window.confirm(`¿Eliminar a ${especialista.nombre}?`)) return
    setError('')
    try {
      const res = await apiFetch(`/especialistas/${especialista.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('No se pudo eliminar al especialista.')
        return
      }
      setEspecialistas((lista) => lista.filter((item) => item.id !== especialista.id))
    } catch {
      setError('No se pudo conectar con el servidor.')
    }
  }

  return (
    <main className="main-dashboard">
      <header className="topbar-admin">
        <div>
          <h1 className="saludo-admin">Especialistas</h1>
          <p className="subtitulo-admin">Equipo de profesionales y precios de atención</p>
        </div>
      </header>

      {error && <p className="msg-admin-error" role="alert">{error}</p>}

      <section className="seccion-tabla-admin">
        <div className="cabecera-tabla-admin">
          <h2>Equipo</h2>
          <button className="btn-nueva-cita" onClick={mostrarForm ? cancelarFormulario : abrirFormulario}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo Especialista'}
          </button>
        </div>

        {mostrarForm && (
          <form className="form-admin-inline form-especialista" onSubmit={guardar}>
            <h3 className="titulo-form-especialista">{editandoId ? 'Editar especialista' : 'Nuevo especialista'}</h3>
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
            <label className="campo-precio-especialista">
              Precio base (CLP)*
              <input
                name="precioBase"
                type="number"
                min="1"
                step="1"
                required
                value={nuevo.precioBase}
                onChange={cambiar}
              />
            </label>
            <div className="acciones-form-especialista">
              <button type="submit" className="btn-accion-tabla" disabled={guardando}>
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar especialista'}
              </button>
              <button type="button" className="btn-accion-tabla" onClick={cancelarFormulario}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="tabla-admin-contenedor">
          <table className="tabla-admin">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Modalidad</th>
                <th>Precio base</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {especialistas.map((especialista) => (
                <tr key={especialista.id}>
                  <td>{especialista.nombre}</td>
                  <td>{especialista.especialidad}</td>
                  <td>{especialista.modalidad}</td>
                  <td>{dinero(especialista.precioBase)}</td>
                  <td>{especialista.activo ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    <button className="btn-accion-tabla" onClick={() => editar(especialista)}>Editar</button>{' '}
                    <button className="btn-accion-tabla" onClick={() => cambiarActivo(especialista)}>
                      {especialista.activo ? 'Desactivar' : 'Activar'}
                    </button>{' '}
                    <button className="btn-accion-tabla" onClick={() => eliminar(especialista)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {especialistas.length === 0 && (
                <tr>
                  <td colSpan="6">No hay especialistas registrados.</td>
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
