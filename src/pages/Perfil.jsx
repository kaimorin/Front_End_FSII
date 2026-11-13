import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { apiGet, salir, useUsuario } from '../api'
import { claseEstado, dinero, nombreComuna, nombreEspecialidad, totalCita } from '../utils/formato'

function Perfil() {
  const usuario = useUsuario()
  const [perfil, setPerfil] = useState(null)
  const [paciente, setPaciente] = useState(null)
  const [citas, setCitas] = useState([])
  const [buscar, setBuscar] = useState('')
  const [error, setError] = useState('')

  // Pide al back los datos de la cuenta, la ficha de paciente y las citas del usuario
  useEffect(() => {
    if (!usuario) return
    async function cargar() {
      try {
        const u = await apiGet(`/usuarios/${usuario.id}`)
        if (!u) {
          setError('No se pudo cargar tu información. Inicia sesión de nuevo.')
          return
        }
        setPerfil(u)
        if (u.rut) {
          const rut = encodeURIComponent(u.rut)
          setPaciente(await apiGet(`/pacientes/rut/${rut}`))
          const lista = await apiGet(`/citas/paciente/${rut}`)
          setCitas([...(lista || [])].sort((a, b) => b.id - a.id))
        }
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
    }
    cargar()
  }, [usuario?.id])

  if (!usuario) {
    return <Navigate to="/login" replace state={{ volverA: '/perfil' }} />
  }

  const nombre = perfil?.nombre || usuario.nombre
  const apellido = perfil?.apellido || usuario.apellido
  const citasFiltradas = citas.filter((c) => String(c.id).includes(buscar.trim()))

  return (
    <main className="contenedor-perfil">
      <aside className="sidebar-cuenta">
        <nav className="menu-cuenta">
          <Link to="/perfil" className="link-menu-cuenta activo">Mi Cuenta</Link>
          <Link to="/perfil" className="link-menu-cuenta">Mis Solicitudes</Link>
          <Link to="/perfil" className="link-menu-cuenta">Tratamientos</Link>

          <hr className="separador-cuenta" />

          <Link to="/perfil" className="sublink-cuenta">Libreta de Direcciones</Link>
          <Link to="/perfil" className="sublink-cuenta">Informacion de la cuenta</Link>
          <Link to="/perfil" className="sublink-cuenta">Metodos de pagos</Link>

          <hr className="separador-cuenta" />

          <Link to="/perfil" className="sublink-cuenta">Subcripciones a boletin informativo</Link>

          <div className="bloque-cerrar-sesion">
            <Link to="/login" className="btn-cerrar-sesion" onClick={() => salir()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar sesion
            </Link>
          </div>
        </nav>
      </aside>

      <section className="panel-cuenta">
        <h1 className="titulo-bienvenida">Bienvenido {nombre}</h1>

        {error && <p className="error-texto">{error}</p>}

        <div className="grid-info-cuenta">
          <div className="tarjeta-info">
            <h3>Informacion de la Cuenta</h3>
            <p>{perfil?.correo || usuario.correo}</p>
            <p>{`${nombre} ${apellido}`}</p>
          </div>

          <div className="tarjeta-info">
            <h3>Direccion</h3>
            {paciente?.ciudad ? (
              <p>{`${paciente.ciudad}${paciente.comuna ? ', ' + nombreComuna(paciente.comuna) : ''}`}</p>
            ) : (
              <p>Aún no registras una dirección. Se guarda cuando agendas tu primera cita.</p>
            )}
          </div>

          <div className="tarjeta-info info-personal-bloque">
            <h3>Informacion Personal</h3>
            <p>{`RUT: ${perfil?.rut || '—'}`}</p>
            <p>{`Tel: ${perfil?.telefono || '—'}`}</p>
          </div>
        </div>

        <div className="cabecera-solicitudes" id="solicitudes">
          <h2>Mis Solicitudes</h2>
          <div className="caja-buscar-id">
            <input
              type="text"
              placeholder="Buscar por :ID"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          </div>
        </div>

        <div className="tabla-solicitudes-contenedor">
          <table className="tabla-solicitudes">
            <thead>
              <tr>
                <th>Citas</th>
                <th>Estado</th>
                <th>Tipo de Atencion</th>
                <th>Precio</th>
                <th>Fecha</th>
                <th>ID</th>
              </tr>
            </thead>
            <tbody>
              {citasFiltradas.map((c) => (
                <tr key={c.id}>
                  <td>{nombreEspecialidad(c.especialidad)}</td>
                  <td><span className={claseEstado(c.estado)}>{c.estado}</span></td>
                  <td>{c.modalidad}</td>
                  <td>{dinero(totalCita(c))}</td>
                  <td>{`${c.fecha} · ${c.hora}`}</td>
                  <td>{c.id}</td>
                </tr>
              ))}
              {citasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="6">Aún no tienes citas agendadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Link to="/reserva/datos" className="btn-editar-solicitudes">Agendar nueva cita</Link>
      </section>
    </main>
  )
}

export default Perfil
