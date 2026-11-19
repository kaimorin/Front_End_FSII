import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiGet } from '../api'
import banner from '../assets/banner-agenda.jpg'
import { dinero } from '../utils/formato'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HORAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTOS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

// Respaldo visual para los tests y para mostrar la página si el API no responde.
// La reserva real siempre vuelve a validar el ID en el backend.
const DOCTORES_BASE = [
  {
    id: 1,
    nombre: 'Maria de Judas',
    especialidad: 'Nutrición Clínica',
    modalidad: 'Presencial y Online',
    precioBase: 35000,
    descripcion: 'Experta en el manejo de enfermedades metabólicas. Crea dietas terapéuticas para controlar condiciones como diabetes, resistencia a la insulina e hipertensión.',
  },
  {
    id: 2,
    nombre: "Maximo Tul 'Onazzo",
    especialidad: 'Nutrición Deportiva',
    modalidad: 'Presencial',
    precioBase: 35000,
    descripcion: 'Enfocado en la recomposición corporal y el rendimiento físico. Diseña planes para aumentar masa muscular, mejorar la recuperación y optimizar la energía.',
  },
  {
    id: 3,
    nombre: "Mario Di 'West",
    especialidad: 'Control de Peso',
    modalidad: 'Online',
    precioBase: 35000,
    descripcion: 'Centrado en la pérdida de grasa sostenible y la educación alimentaria. Trabaja en modificar hábitos a largo plazo sin utilizar dietas extremas o restrictivas.',
  },
  {
    id: 4,
    nombre: "Shaqueal O'neal",
    especialidad: 'Salud Digestiva',
    modalidad: 'Presencial y Online',
    precioBase: 35000,
    descripcion: 'Experto en el microbioma intestinal. Su enfoque está en tratar inflamaciones, síndrome de intestino irritable y alergias alimentarias para mejorar la digestión.',
  },
]

function primerDiaDisponible() {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  if (fecha.getDay() === 0) fecha.setDate(fecha.getDate() + 1)
  return fecha
}

function fechaAISO(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function fechaALarga(fecha) {
  return `${DIAS[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()].toLowerCase()} de ${fecha.getFullYear()}`
}

function opcionesRueda(valores, actual) {
  const pos = valores.indexOf(actual)
  const lista = []
  for (let i = -3; i <= 3; i++) {
    const idx = (pos + i + valores.length) % valores.length
    lista.push(valores[idx])
  }
  return lista
}

function modalidadesDe(especialista) {
  const modalidad = String(especialista?.modalidad || '').toLowerCase()
  const disponibles = []
  if (modalidad.includes('presencial')) disponibles.push('Presencial')
  if (modalidad.includes('online')) disponibles.push('Online')
  return disponibles
}

function Agenda() {
  const navigate = useNavigate()
  const hoy = primerDiaDisponible()
  const alertaRef = useRef(null)

  const [fecha, setFecha] = useState(hoy)
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [hora, setHora] = useState(11)
  const [minuto, setMinuto] = useState(0)
  const [ampm, setAmpm] = useState('AM')
  const [error, setError] = useState('')
  const [doctores, setDoctores] = useState(DOCTORES_BASE)
  const [especialistaId, setEspecialistaId] = useState(String(DOCTORES_BASE[0].id))
  const [modalidad, setModalidad] = useState('Presencial')

  const especialistaSeleccionado = doctores.find((doctor) => String(doctor.id) === String(especialistaId))
  const modalidades = modalidadesDe(especialistaSeleccionado)
  const horaTexto = `${hora}:${String(minuto).padStart(2, '0')} ${ampm}`
  const fechaCorta = `${MESES[fecha.getMonth()].slice(0, 3)} ${fecha.getDate()}, ${fecha.getFullYear()}`
  const fechaISO = fechaAISO(fecha)
  const fechaLarga = fechaALarga(fecha)

  useEffect(() => {
    async function cargarEspecialistas() {
      const lista = await apiGet('/especialistas/activos')
      if (!Array.isArray(lista)) return
      if (lista.length === 0) {
        setDoctores([])
        setEspecialistaId('')
        setModalidad('')
        return
      }

      const especialistasActivos = lista.map((especialista) => ({
        id: especialista.id,
        nombre: especialista.nombre,
        especialidad: especialista.especialidad,
        modalidad: especialista.modalidad,
        descripcion: especialista.descripcion || 'Profesional del equipo Nutrivida.',
        precioBase: Number(especialista.precioBase) > 0 ? Number(especialista.precioBase) : 35000,
      }))

      setDoctores(especialistasActivos)
      setEspecialistaId(String(especialistasActivos[0].id))
      const opciones = modalidadesDe(especialistasActivos[0])
      setModalidad(opciones[0] || 'Presencial')
    }
    cargarEspecialistas()
  }, [])

  useEffect(() => {
    if (error) {
      alertaRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  const primerDiaSemana = new Date(anio, mes, 1).getDay()
  const diasDelMes = new Date(anio, mes + 1, 0).getDate()
  const diasMesAnterior = new Date(anio, mes, 0).getDate()
  const celdas = []

  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    celdas.push({ numero: diasMesAnterior - i, fuera: true })
  }
  for (let dia = 1; dia <= diasDelMes; dia++) {
    celdas.push({ numero: dia, fuera: false })
  }
  let proximo = 1
  while (celdas.length % 7 !== 0) {
    celdas.push({ numero: proximo++, fuera: true })
  }

  function cambiarMes(cambio) {
    let nuevoMes = mes + cambio
    let nuevoAnio = anio
    if (nuevoMes < 0) {
      nuevoMes = 11
      nuevoAnio--
    } else if (nuevoMes > 11) {
      nuevoMes = 0
      nuevoAnio++
    }
    setMes(nuevoMes)
    setAnio(nuevoAnio)
  }

  function irAHoy() {
    setFecha(hoy)
    setMes(hoy.getMonth())
    setAnio(hoy.getFullYear())
    setError('')
  }

  function seleccionarDia(celda) {
    if (celda.fuera) return
    const nuevaFecha = new Date(anio, mes, celda.numero)
    nuevaFecha.setHours(0, 0, 0, 0)
    setFecha(nuevaFecha)

    const hoyNormalizado = new Date()
    hoyNormalizado.setHours(0, 0, 0, 0)
    if (nuevaFecha < hoyNormalizado) {
      setError('La fecha que elegiste ya pasó. Elige hoy o un día más adelante.')
    } else if (nuevaFecha.getDay() === 0) {
      setError('No atendemos los domingos. Elige un día de lunes a sábado.')
    } else {
      setError('')
    }
  }

  function cambiarEspecialista(e) {
    const id = e.target.value
    const seleccionado = doctores.find((doctor) => String(doctor.id) === id)
    const disponibles = modalidadesDe(seleccionado)
    setEspecialistaId(id)
    setModalidad(disponibles[0] || '')
    setError('')
  }

  function siguiente(e) {
    e.preventDefault()
    setError('')

    if (!especialistaSeleccionado) {
      setError('Selecciona un especialista para continuar.')
      return
    }

    const hoyNormalizado = new Date()
    hoyNormalizado.setHours(0, 0, 0, 0)
    if (fecha < hoyNormalizado) {
      setError('La fecha que elegiste ya pasó. Elige hoy o un día más adelante.')
      return
    }
    if (fecha.getDay() === 0) {
      setError('No atendemos los domingos. Elige un día de lunes a sábado.')
      return
    }
    if (!modalidades.includes(modalidad)) {
      setError('Selecciona una modalidad disponible para este especialista.')
      return
    }

    let hora24 = hora % 12
    if (ampm === 'PM') hora24 += 12
    const minutosDelDia = hora24 * 60 + minuto
    if (minutosDelDia < 10 * 60 + 30 || minutosDelDia > 17 * 60 + 30) {
      setError('Atendemos de lunes a sábado, de 10:30 AM a 5:30 PM. Elige otra hora.')
      return
    }

    const cita = {
      especialistaId: Number(especialistaSeleccionado.id),
      doctor: especialistaSeleccionado.nombre,
      especialidad: especialistaSeleccionado.especialidad,
      modalidad,
      fecha: fechaLarga,
      fechaISO,
      hora: horaTexto,
      precioBase: especialistaSeleccionado.precioBase,
    }

    sessionStorage.setItem('cita', JSON.stringify(cita))
    navigate('/reserva/pago')
  }

  return (
    <main className="agenda-page">
      <section className="banner-agenda">
        <img src={banner} alt="Calendario" className="img-banner-agenda" />
      </section>

      <section className="pasos-agenda">
        <div className="paso">1. Datos Personales</div>
        <div className="paso paso-activo">2. Doctor y Especialidad</div>
        <div className="paso">3. Pago y facturacion</div>
      </section>

      {error && <div className="alerta-error" role="alert" aria-live="assertive" ref={alertaRef}>{error}</div>}

      <section className="contenedor-agenda">
        <form id="formAgenda" className="columna-doctores" onSubmit={siguiente}>
          <h2 className="titulo-seleccion-especialista">Elige tu especialista</h2>

          {doctores.length === 0 && (
            <p className="aviso-sin-especialistas">No hay especialistas disponibles para reservar en este momento.</p>
          )}

          {doctores.map((doctor) => (
            <label className="tarjeta-radio-doc" key={doctor.id}>
              <input
                type="radio"
                name="especialistaId"
                value={doctor.id}
                checked={String(especialistaId) === String(doctor.id)}
                onChange={cambiarEspecialista}
              />
              <div className="circulo-check"></div>
              <div className="info-doc">
                <strong>{doctor.nombre}</strong>
                <span className="especialidad-doc">{doctor.especialidad}</span>
                <p>{doctor.descripcion}</p>
                <span className="precio-especialista">Valor base: {dinero(doctor.precioBase)} + IVA</span>
              </div>
            </label>
          ))}

          <div className="bloque-seleccion-modalidad">
            <h3>Modalidad de atención</h3>
            <div className="fila-modalidad">
              {modalidades.map((opcion) => (
                <label className="tarjeta-radio-modalidad" key={opcion}>
                  <input
                    type="radio"
                    name="modalidad"
                    value={opcion}
                    checked={modalidad === opcion}
                    onChange={() => setModalidad(opcion)}
                  />
                  <div className="circulo-check"></div>
                  <span>{opcion}</span>
                </label>
              ))}
            </div>
          </div>

          {especialistaSeleccionado && (
            <div className="resumen-especialista">
              <span>Especialidad seleccionada</span>
              <strong>{especialistaSeleccionado.especialidad}</strong>
              <span>El precio final incluirá el IVA del 19%.</span>
            </div>
          )}

          <div className="fila-botones-paso">
            <button type="submit" className="btn-siguiente-paso" id="btnSiguientePaso" disabled={doctores.length === 0}>Siguiente</button>
            <Link to="/reserva/datos" className="btn-volver-paso">Volver</Link>
          </div>
        </form>

        <aside className="columna-picker">
          <div className="resumen-pildoras">
            <span>Fecha</span>
            <span className="pildora-tag">{fechaCorta}</span>
            <span className="pildora-tag">{horaTexto}</span>
          </div>

          <div className="widget-calendario">
            <div className="cal-barra-dia">{DIAS[fecha.getDay()]}</div>
            <div className="cal-cabecera-mes">
              <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">&lt;</button>
              <div className="cal-mes">{MESES[mes].slice(0, 3).toUpperCase()}</div>
              <div className="cal-dia-numero">{fecha.getDate()}</div>
              <div className="cal-anio">{anio}</div>
              <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">&gt;</button>
            </div>

            <div className="cal-cuerpo">
              <div className="cal-dias-semana">
                <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
              </div>
              <div className="cal-matriz-numeros">
                {celdas.map((celda, indice) => {
                  const fechaCelda = new Date(anio, mes, celda.numero)
                  const esSeleccionado = !celda.fuera
                    && fecha.getDate() === celda.numero
                    && fecha.getMonth() === mes
                    && fecha.getFullYear() === anio

                  return (
                    <button
                      type="button"
                      key={`${celda.numero}-${indice}`}
                      onClick={() => seleccionarDia(celda)}
                      disabled={celda.fuera}
                      className={`cal-dia ${celda.fuera ? 'dia-apagado' : ''} ${esSeleccionado ? 'dia-marcado' : ''} ${!celda.fuera && fechaCelda.getDay() === 0 ? 'dia-domingo' : ''}`}
                      aria-label={`${celda.numero} de ${MESES[mes]}`}
                    >
                      {celda.numero}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="cal-acciones">
              <button type="button" className="btn-cal-cancel" onClick={irAHoy}>HOY</button>
            </div>
          </div>

          <div className="widget-hora">
            <div className="hora-header">
              <span>Hora</span>
              <span className="hora-valor">{horaTexto}</span>
            </div>

            <div className="hora-selector-rueda">
              <div className="col-rueda">
                {opcionesRueda(HORAS, hora).map((valor, indice) => (
                  <span
                    key={indice}
                    onClick={() => setHora(valor)}
                    className={`op-rueda ${valor === hora ? 'activa' : 'apagado'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {valor}
                  </span>
                ))}
              </div>

              <div className="col-rueda">
                {opcionesRueda(MINUTOS, minuto).map((valor, indice) => (
                  <span
                    key={indice}
                    onClick={() => setMinuto(valor)}
                    className={`op-rueda ${valor === minuto ? 'activa' : 'apagado'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {String(valor).padStart(2, '0')}
                  </span>
                ))}
              </div>

              <div className="col-rueda col-meridiano">
                <span onClick={() => setAmpm('AM')} className={`op-rueda ${ampm === 'AM' ? 'activa' : 'apagado'}`} style={{ cursor: 'pointer' }}>AM</span>
                <span onClick={() => setAmpm('PM')} className={`op-rueda ${ampm === 'PM' ? 'activa' : 'apagado'}`} style={{ cursor: 'pointer' }}>PM</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default Agenda
