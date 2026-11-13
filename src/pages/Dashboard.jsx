import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { apiGet, useUsuario } from '../api'
import { claseEstado, coincide, dinero, esDelMes, fechaLarga, nombreEspecialidad, totalCita } from '../utils/formato'

function Dashboard() {
  const navigate = useNavigate()
  const usuario = useUsuario()
  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [hoy] = useState(() => fechaLarga(new Date()))

  useEffect(() => {
    async function cargar() {
      try {
        const [listaCitas, listaPacientes] = await Promise.all([apiGet('/citas'), apiGet('/pacientes')])
        if (!listaCitas || !listaPacientes) {
          setError('No se pudieron cargar los datos del panel.')
          return
        }
        setCitas([...listaCitas].sort((a, b) => b.id - a.id)) // las más nuevas primero
        setPacientes(listaPacientes)
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
    }
    cargar()
  }, [])

  // Métricas calculadas con las citas reales
  const confirmadas = citas.filter((c) => c.estado === 'Confirmado' || c.estado === 'Atendido')
  const ingresosMes = confirmadas.filter((c) => esDelMes(c.fecha)).reduce((suma, c) => suma + totalCita(c), 0)
  const pendientes = citas.filter((c) => c.estado === 'Pendiente').length
  const citasHoy = citas.filter((c) => c.fecha === hoy && c.estado !== 'Cancelado').length

  const proximas = citas
    .filter((c) => c.estado === 'Pendiente' || c.estado === 'Confirmado')
    .filter((c) => coincide(busqueda, [c.pacienteNombre, c.pacienteApellido, c.pacienteRut, c.id]))
    .slice(0, 8)

  return (
    <main className="main-dashboard">

      <header className="topbar-admin">
        <div>
          <h1 className="saludo-admin">Panel General</h1>
          <p className="subtitulo-admin">Bienvenido de vuelta, {usuario?.nombre}</p>
        </div>
        <div className="buscador-admin">
          <input
            type="text"
            placeholder="Buscar paciente, RUT o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </header>

      {error && <p className="msg-admin-error">{error}</p>}

      <section className="grid-metricas">
        <div className="tarjeta-metrica">
          <span className="label-metrica">Citas de Hoy</span>
          <span className="valor-metrica">{citasHoy}</span>
        </div>
        <div className="tarjeta-metrica">
          <span className="label-metrica">Pacientes Registrados</span>
          <span className="valor-metrica">{pacientes.length}</span>
        </div>
        <div className="tarjeta-metrica">
          <span className="label-metrica">Ingresos del Mes</span>
          <span className="valor-metrica">{dinero(ingresosMes)}</span>
        </div>
        <div className="tarjeta-metrica">
          <span className="label-metrica">Citas Pendientes</span>
          <span className="valor-metrica">{pendientes}</span>
        </div>
      </section>

      <section className="seccion-tabla-admin">
        <div className="cabecera-tabla-admin">
          <h2>Próximas Citas Médicas</h2>
          <button className="btn-nueva-cita" onClick={() => navigate('/reserva/datos')}>+ Nueva Cita</button>
        </div>

        <div className="tabla-admin-contenedor">
          <table className="tabla-admin">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Especialista</th>
                <th>Servicio</th>
                <th>Fecha y Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map((c) => (
                <tr key={c.id}>
                  <td>{`${c.pacienteNombre} ${c.pacienteApellido}`}</td>
                  <td>{c.doctor}</td>
                  <td>{nombreEspecialidad(c.especialidad)}</td>
                  <td>{`${c.fecha} - ${c.hora}`}</td>
                  <td><span className={claseEstado(c.estado)}>{c.estado}</span></td>
                  <td><button className="btn-accion-tabla" onClick={() => navigate('/admin/citas')}>Ver</button></td>
                </tr>
              ))}
              {proximas.length === 0 && (
                <tr>
                  <td colSpan="6">No hay citas para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
