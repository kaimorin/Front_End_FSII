import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiGet } from '../api'
import { PRECIO_CITA, dinero, fechaLarga } from '../utils/formato'
import banner from '../assets/banner-agenda.jpg'

// Respaldo si el back no responde. Si /especialistas/activos devuelve datos, se usan esos.
const DOCTORES_BASE = [
  { id: 1, nombre: 'Maria de Judas', especialidad: 'Nutrición Clínica', modalidad: 'Presencial y Online', descripcion: 'Planes de alimentación para el bienestar general y el control de enfermedades crónicas.', precioBase: 35000 },
  { id: 2, nombre: "Maximo Tul 'Onazzo", especialidad: 'Nutrición Deportiva', modalidad: 'Presencial', descripcion: 'Rendimiento, recuperación e hidratación con pauta personalizada.', precioBase: 35000 },
  { id: 3, nombre: "Mario Di 'West", especialidad: 'Salud Digestiva', modalidad: 'Presencial y Online', descripcion: 'Equilibrio de la microbiota intestinal y hábitos alimentarios.', precioBase: 35000 },
  { id: 4, nombre: "Shaqueal O'neal", especialidad: 'Control de Peso', modalidad: 'Presencial y Online', descripcion: 'Hábitos sostenibles para la composición corporal.', precioBase: 35000 },
]

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const CABECERA_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const HORAS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const MINUTOS = ['00', '30']

// Horario de atención: lunes a sábado, 10:30 a 17:30 (minutos desde la medianoche)
const APERTURA = 10 * 60 + 30
const CIERRE = 17 * 60 + 30

function inicioDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

// Mañana, o el lunes si mañana es domingo
function siguienteHabil(desde) {
  const f = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1)
  if (f.getDay() === 0) f.setDate(f.getDate() + 1)
  return f
}

function aISO(fecha) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function modalidadesDe(doctor) {
  const texto = String(doctor?.modalidad || 'Presencial').toLowerCase()
  const lista = []
  if (texto.includes('presencial')) lista.push('Presencial')
  if (texto.includes('online')) lista.push('Online')
  return lista.length > 0 ? lista : ['Presencial']
}

function Agenda() {
  const navigate = useNavigate()
  const [hoy] = useState(() => inicioDia(new Date()))
  const [doctores, setDoctores] = useState(DOCTORES_BASE)
  const [doctorId, setDoctorId] = useState(DOCTORES_BASE[0].id)
  const [modalidadElegida, setModalidadElegida] = useState('Presencial')
  const [fecha, setFecha] = useState(() => siguienteHabil(inicioDia(new Date())))
  const [vista, setVista] = useState(() => ({ anio: hoy.getFullYear(), mes: hoy.getMonth() }))
  const [hora12, setHora12] = useState('10')
  const [minutos, setMinutos] = useState('30')
  const [meridiano, setMeridiano] = useState('AM')
  const [error, setError] = useState('')

  // Pide al back los especialistas activos; si falla, se queda con la lista de respaldo
  useEffect(() => {
    async function cargar() {
      const lista = await apiGet('/especialistas/activos')
      if (Array.isArray(lista) && lista.length > 0) setDoctores(lista)
    }
    cargar()
  }, [])

  // Valores derivados: el especialista manda sobre las modalidades disponibles
  const doctor = doctores.find((d) => String(d.id) === String(doctorId)) || doctores[0]
  const modalidades = modalidadesDe(doctor)
  const modalidad = modalidades.includes(modalidadElegida) ? modalidadElegida : modalidades[0]
  const precioBase = Number(doctor?.precioBase) || PRECIO_CITA
  const horaTexto = `${hora12}:${minutos} ${meridiano}`

  function elegirDoctor(id) {
    setDoctorId(id)
    setError('')
  }

  // Valida y selecciona un día. Los días pasados y los domingos muestran una alerta.
  function seleccionar(f) {
    if (f < hoy) {
      setError('La fecha que elegiste ya pasó. Elige hoy o un día posterior.')
      return
    }
    if (f.getDay() === 0) {
      setError('No atendemos los domingos. Elige un día de lunes a sábado.')
      return
    }
    setError('')
    setFecha(f)
  }

  function cambiarMes(delta) {
    setVista((v) => {
      const f = new Date(v.anio, v.mes + delta, 1)
      return { anio: f.getFullYear(), mes: f.getMonth() }
    })
  }

  function irAHoy() {
    setVista({ anio: hoy.getFullYear(), mes: hoy.getMonth() })
    seleccionar(hoy)
  }

  function continuar() {
    if (!doctor) {
      setError('Selecciona un especialista.')
      return
    }
    const h = (Number(hora12) % 12) + (meridiano === 'PM' ? 12 : 0)
    const minutosDelDia = h * 60 + Number(minutos)
    if (minutosDelDia < APERTURA || minutosDelDia > CIERRE) {
      setError('Atendemos de lunes a sábado, de 10:30 AM a 05:30 PM.')
      return
    }
    const ahora = new Date()
    const esHoy = aISO(fecha) === aISO(ahora)
    if (esHoy && minutosDelDia <= ahora.getHours() * 60 + ahora.getMinutes()) {
      setError('La hora que elegiste ya pasó. Elige una hora posterior.')
      return
    }

    // Pago.jsx y Confirmacion.jsx leen esta cita desde sessionStorage
    const cita = {
      especialistaId: Number(doctor.id),
      doctor: doctor.nombre,
      especialidad: doctor.especialidad,
      modalidad,
      fecha: fechaLarga(fecha),
      fechaISO: aISO(fecha),
      hora: horaTexto,
      precioBase,
    }
    sessionStorage.setItem('cita', JSON.stringify(cita))
    navigate('/reserva/pago')
  }

  // Cuadrícula del calendario (semana desde el lunes)
  const vacios = (new Date(vista.anio, vista.mes, 1).getDay() + 6) % 7
  const diasDelMes = new Date(vista.anio, vista.mes + 1, 0).getDate()

  return (
    <main>
      <section className="banner-agenda">
        <img src={banner} alt="Agenda tu cita" />
      </section>

      <section className="pasos-agenda">
        <div className="paso">1. Datos Personales</div>
        <div className="paso paso-activo">2. Doctor y Especialidad</div>
        <div className="paso">3. Pago y Facturacion</div>
      </section>

      {error && <div className="alerta-error" role="alert">{error}</div>}

      <section className="contenedor-agenda">
        <div className="columna-doctores">
          <h2 className="titulo-seleccion-especialista">Elige a tu especialista</h2>

          {doctores.map((d) => (
            <label key={d.id} className="tarjeta-radio-doc">
              <input
                type="radio"
                name="especialista"
                value={d.id}
                checked={String(d.id) === String(doctor?.id)}
                onChange={() => elegirDoctor(d.id)}
              />
              <div>
                <strong>{d.nombre}</strong>
                <span className="especialidad-doc">{d.especialidad}</span>
                {d.descripcion && <p>{d.descripcion}</p>}
                <span className="precio-especialista">{`Valor base: ${dinero(Number(d.precioBase) || PRECIO_CITA)}`}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="columna-picker">
          <div className="bloque-seleccion-modalidad">
            <h3>Modalidad de atención</h3>
            <div className="fila-modalidad">
              {modalidades.map((m) => (
                <label key={m} className="tarjeta-radio-modalidad">
                  <input
                    type="radio"
                    name="modalidad"
                    value={m}
                    checked={modalidad === m}
                    onChange={() => setModalidadElegida(m)}
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="resumen-pildoras">
            <span className="pildora-tag">{`${fecha.getDate()} de ${MESES[fecha.getMonth()]}`}</span>
            <span className="pildora-tag">{horaTexto}</span>
          </div>

          <div className="widget-calendario">
            <div className="cal-barra-dia">{DIAS[fecha.getDay()]}</div>
            <div className="cal-cabecera-mes">
              <div>{`${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`}</div>
              <div className="cal-dia-numero">{fecha.getDate()}</div>
            </div>

            <div className="cal-cuerpo">
              <div className="cal-nav">
                <button type="button" aria-label="Mes anterior" onClick={() => cambiarMes(-1)}>‹</button>
                <span>{`${MESES[vista.mes]} ${vista.anio}`}</span>
                <button type="button" aria-label="Mes siguiente" onClick={() => cambiarMes(1)}>›</button>
              </div>

              <div className="cal-dias-semana">
                {CABECERA_SEMANA.map((l, i) => <span key={i}>{l}</span>)}
              </div>

              <div className="cal-matriz-numeros">
                {Array.from({ length: vacios }, (_, i) => <span key={`v${i}`} />)}
                {Array.from({ length: diasDelMes }, (_, i) => {
                  const dia = i + 1
                  const f = new Date(vista.anio, vista.mes, dia)
                  const clases = ['cal-dia']
                  if (f < hoy) clases.push('dia-apagado')
                  if (f.getDay() === 0) clases.push('dia-domingo')
                  if (aISO(f) === aISO(fecha)) clases.push('dia-marcado')
                  return (
                    <button
                      key={dia}
                      type="button"
                      className={clases.join(' ')}
                      aria-label={`${dia} de ${MESES[vista.mes]}`}
                      onClick={() => seleccionar(f)}
                    >
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="cal-acciones">
              <button type="button" className="btn-cal-hoy" onClick={irAHoy}>Hoy</button>
            </div>
          </div>

          <div className="widget-hora">
            <div className="hora-header">
              <span>Selecciona la hora</span>
              <span>{horaTexto}</span>
            </div>
            <div className="hora-selector-rueda">
              <div className="col-rueda">
                {HORAS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={h === hora12 ? 'op-rueda activa' : 'op-rueda apagado'}
                    onClick={() => setHora12(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="col-rueda">
                {MINUTOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={m === minutos ? 'op-rueda activa' : 'op-rueda apagado'}
                    onClick={() => setMinutos(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="col-rueda col-meridiano">
                {['AM', 'PM'].map((m) => (
                  <span
                    key={m}
                    role="button"
                    tabIndex={0}
                    className={m === meridiano ? 'op-rueda activa' : 'op-rueda apagado'}
                    onClick={() => setMeridiano(m)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setMeridiano(m)
                      }
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="resumen-especialista">
            <span>{`Reserva con ${doctor?.nombre || ''}`}</span>
            <strong>{`Valor base: ${dinero(precioBase)}`}</strong>
          </div>

          <div className="fila-botones-paso">
            <button type="button" id="btnSiguientePaso" className="btn-siguiente-paso" onClick={continuar}>
              Siguiente
            </button>
            <Link to="/reserva/datos" className="btn-volver-paso">Volver</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Agenda
