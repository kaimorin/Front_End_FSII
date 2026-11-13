import { useEffect, useState } from 'react'
import { apiGet } from '../api'
import { dinero, esDelMes, nombreEspecialidad, totalCita } from '../utils/formato'

// El back no guarda un "estado de pago": una cita Pendiente aún no está confirmada,
// una Cancelada no se cobra y el resto se considera pagada.
function estadoPago(cita) {
  if (cita.estado === 'Pendiente') return 'Pendiente'
  if (cita.estado === 'Cancelado') return 'Cancelado'
  return 'Pagado'
}

function Reportes() {
  const [citas, setCitas] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargar() {
      try {
        const lista = await apiGet('/citas')
        if (!lista) {
          setError('No se pudieron cargar los pagos.')
          return
        }
        setCitas([...lista].sort((a, b) => b.id - a.id))
      } catch {
        setError('No se pudo conectar con el servidor.')
      }
    }
    cargar()
  }, [])

  const pagadas = citas.filter((c) => estadoPago(c) === 'Pagado')
  const ingresosMes = pagadas.filter((c) => esDelMes(c.fecha)).reduce((suma, c) => suma + totalCita(c), 0)
  const pendientes = citas.filter((c) => estadoPago(c) === 'Pendiente').length

  return (
    <main className="main-dashboard">
      <header className="topbar-admin">
        <div>
          <h1 className="saludo-admin">Reportes y Pagos</h1>
          <p className="subtitulo-admin">Resumen de ingresos y pagos</p>
        </div>
      </header>

      {error && <p className="msg-admin-error">{error}</p>}

      <section className="grid-metricas">
        <div className="tarjeta-metrica">
          <span className="label-metrica">Ingresos del Mes</span>
          <span className="valor-metrica">{dinero(ingresosMes)}</span>
        </div>
        <div className="tarjeta-metrica">
          <span className="label-metrica">Pagos Realizados</span>
          <span className="valor-metrica">{pagadas.length}</span>
        </div>
        <div className="tarjeta-metrica">
          <span className="label-metrica">Pendientes de Pago</span>
          <span className="valor-metrica">{pendientes}</span>
        </div>
      </section>

      <section className="seccion-tabla-admin">
        <div className="cabecera-tabla-admin">
          <h2>Últimos Pagos</h2>
        </div>

        <div className="tabla-admin-contenedor">
          <table className="tabla-admin">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Servicio</th>
                <th>Método</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.slice(0, 10).map((c) => {
                const estado = estadoPago(c)
                const clase = estado === 'Pagado' ? 'badge badge-finalizado' : estado === 'Cancelado' ? 'badge badge-cancelado' : 'badge badge-pendiente'
                return (
                  <tr key={c.id}>
                    <td>{`${c.pacienteNombre} ${c.pacienteApellido}`}</td>
                    <td>{nombreEspecialidad(c.especialidad)}</td>
                    <td>{c.metodoPago || '—'}</td>
                    <td>{dinero(totalCita(c))}</td>
                    <td><span className={clase}>{estado}</span></td>
                  </tr>
                )
              })}
              {citas.length === 0 && (
                <tr>
                  <td colSpan="5">Aún no hay pagos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Reportes
